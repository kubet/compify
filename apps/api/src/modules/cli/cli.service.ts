import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Component,
  ComponentVisibility,
  RuntimeLanguage,
} from 'src/entities/project/component.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { shortIdToUuid, uuidToShortId } from 'src/common/short-id';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { MinioClientService } from '../minio/minio.service';
import { isSafeRegistryPath } from 'src/common/registry-path';
import { createHash } from 'crypto';
import { authenticateCliToken } from 'src/common/cli-token-auth';
import { ComponentService } from '../compontent/component.service';
import { ConfigService } from '@nestjs/config';
import { ComponentRevision } from 'src/entities/project/component-revision.entity';
import {
  PublishStoryDto,
  PublishStoryV2Dto,
} from 'src/models/cli/publish-story.dto';

@Injectable()
export class CliService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectRepository(CliToken)
    private readonly cliTokenRepo: Repository<CliToken>,
    private readonly minioService: MinioClientService,
    private readonly componentService: ComponentService,
    private readonly configService: ConfigService,
    @InjectRepository(ComponentRevision)
    private readonly componentRevisionRepository?: Repository<ComponentRevision>,
  ) {}

  async getUserByCliToken(cliToken: string) {
    return authenticateCliToken(this.cliTokenRepo, cliToken);
  }

  async getAll(cliToken: string) {
    const user = await this.getUserByCliToken(cliToken);
    const components = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.user.id = :userId', { userId: user.id })
      .select([
        'component.id as id',
        'component.name as name',
        'component.language as language',
        'component.usedUiFrameworks as "usedUiFrameworks"',
      ])
      .getRawMany();
    return components.map((component) => ({
      id: uuidToShortId(component.id),
      name: component.name,
      language: component.language,
      usedUiFrameworks: component.usedUiFrameworks,
    }));
  }

  async get(id: string, cliToken: string) {
    const user = await this.getUserByCliToken(cliToken);
    const q = this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user');

    // Components are addressable by short id or by publishing domain
    // ("@username/name" — stored without the leading "@").
    if (id.startsWith('@')) {
      const domain = id.substring(1);
      const domains = domain.includes('/')
        ? [domain]
        : [domain, `compify/${domain}`];
      q.where('component.publishingDomain IN (:...domains)', { domains });
    } else {
      q.where('component.id = :id', { id: shortIdToUuid(id) });
    }
    const component = await q.getOne();

    if (!component) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }

    const isOwner = component.user.id === user.id;
    if (
      !isOwner &&
      (component.visibility === ComponentVisibility.PRIVATE ||
        component.visibility === ComponentVisibility.DRAFT)
    ) {
      throw new ForbiddenException();
    }

    const f =
      (
        await this.minioService.getFile('components', `${component.id}`)
      )?.buffer.toString() || '{}';

    // Define the expected structure of the files
    interface FileContent {
      code: string;
    }

    const files = JSON.parse(f) as Record<string, FileContent>;

    // Add null check and provide fallback for malformed entries
    const remappedFiles = Object.fromEntries(
      Object.entries(files)
        .map(
          ([filename, content]) =>
            [filename.replace(/^\/+/, ''), content] as const,
        )
        .filter(([filename]) => isSafeRegistryPath(filename))
        .map(([filename, content]) => [filename, content?.code || '']),
    );

    return {
      id: uuidToShortId(component?.id),
      name: component?.name,
      language: component?.language,
      usedUiFrameworks: component?.usedUiFrameworks,
      files: remappedFiles,
    };
  }

  async publishStory(body: unknown, authorization?: string) {
    const token = this.bearerToken(authorization);
    const user = await this.getUserByCliToken(token);
    const input = this.validatePublishStory(body);
    const normalized = normalizePublishStory(input);
    const { digest, ...unsigned } = normalized;
    const computedDigest = createHash('sha256')
      .update(canonicalJson(unsigned))
      .digest('hex');
    if (digest !== computedDigest) {
      throw new BadRequestException('Digest does not match request contents');
    }

    const v2 = normalized.schemaVersion === 2 ? normalized : undefined;
    const v1 = normalized.schemaVersion === 1 ? normalized : undefined;
    const publishingDomain = `${user.username}/${normalized.publishingName}`;
    const existing = await this.findPublishedComponent(publishingDomain);
    if (existing && existing.user?.id !== user.id) {
      throw new ForbiddenException();
    }

    // Digest idempotency is checked before touching either mutable component
    // metadata or object storage. A retry therefore returns the original
    // revision even when newer revisions have subsequently been published.
    if (v2 && existing && this.componentRevisionRepository) {
      const prior = await this.componentRevisionRepository.findOne({
        where: { component: { id: existing.id }, digest: computedDigest },
      });
      if (prior) {
        return this.publishResponse(
          existing,
          normalized.visibility,
          computedDigest,
          prior.revision,
        );
      }
    }

    if (
      v1 &&
      existing &&
      existing.pageSettings?.storybook?.schemaVersion === 1 &&
      existing.pageSettings.storybook.digest === computedDigest
    ) {
      return this.publishResponse(
        existing,
        normalized.visibility,
        computedDigest,
      );
    }

    const sourceFiles: Record<string, string> = v2
      ? Object.fromEntries(
          v2.registryItem.files.map((file) => [file.path, file.content]),
        )
      : v1!.files;
    const dependencyVersions = v2 ? v2.dependencyVersions : v1!.dependencies;
    const name = v2 ? v2.registryItem.name : v1!.name;
    const description = v2 ? v2.registryItem.description : v1!.description;
    const storedFiles = Object.fromEntries(
      Object.entries(sourceFiles).map(([filePath, code]) => [
        filePath,
        { code },
      ]),
    );
    const storybook = {
      schemaVersion: normalized.schemaVersion,
      entry: normalized.entry,
      stories: normalized.stories,
      provenance: normalized.provenance,
      digest: computedDigest,
      ...(v2 ? { registryItem: v2.registryItem } : {}),
    };
    const component = await this.componentService.create(
      {
        ...(existing ? { id: uuidToShortId(existing.id) } : {}),
        name,
        description,
        code: JSON.stringify(storedFiles),
        publishingName: normalized.publishingName,
        visibility:
          normalized.visibility === 'public'
            ? ComponentVisibility.PUBLIC
            : normalized.visibility === 'unlisted'
              ? ComponentVisibility.FREE
              : ComponentVisibility.PRIVATE,
        language: ['tsx', 'ts'].includes(normalized.language)
          ? RuntimeLanguage.REACT_TS
          : RuntimeLanguage.REACT,
        activeFile: normalized.entry,
        previewFile: normalized.entry,
        usedDeps: { global: dependencyVersions, files: {} },
        pageSettings: { storybook },
      },
      user,
    );

    let revision: number | undefined;
    if (v2 && this.componentRevisionRepository) {
      const persisted =
        existing || (await this.findPublishedComponent(publishingDomain));
      if (!persisted) {
        throw new NotFoundException('Published component was not persisted');
      }
      const latest = await this.componentRevisionRepository.findOne({
        where: { component: { id: persisted.id } },
        order: { revision: 'DESC' },
      });
      const entity = this.componentRevisionRepository.create({
        component: { id: persisted.id } as Component,
        digest: computedDigest,
        revision: (latest?.revision || 0) + 1,
        schemaVersion: 2,
        visibility:
          normalized.visibility === 'public'
            ? ComponentVisibility.PUBLIC
            : normalized.visibility === 'unlisted'
              ? ComponentVisibility.FREE
              : ComponentVisibility.PRIVATE,
        registryItem: v2.registryItem as unknown as Record<string, unknown>,
      });
      const saved = await this.componentRevisionRepository.save(entity);
      revision = saved.revision;
    }

    return this.publishResponse(
      component,
      normalized.visibility,
      computedDigest,
      revision,
    );
  }

  private async findPublishedComponent(publishingDomain: string) {
    const query = this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.publishingDomain = :publishingDomain', {
        publishingDomain,
      });
    return query.getOne();
  }

  private publishResponse(
    component: Pick<Component, 'id' | 'publishingDomain'>,
    visibility: 'public' | 'private' | 'unlisted',
    digest: string,
    revision?: number,
  ) {
    const backendUrl = this.baseUrl('BACKEND_URL', 'http://localhost:3009');
    const frontendUrl = this.baseUrl('FRONTEND_URL', 'http://localhost:3000');
    const publiclyAddressable = visibility !== 'private';
    const componentId = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(component.id)
      ? uuidToShortId(component.id)
      : component.id;
    return {
      componentId,
      publishingDomain: component.publishingDomain,
      digest,
      registryUrl: `${backendUrl}/r/${component.publishingDomain}.json`,
      ...(revision !== undefined
        ? {
            revision,
            immutableRegistryUrl: `${backendUrl}/r/${component.publishingDomain}/${digest}.json`,
          }
        : {}),
      previewUrl: publiclyAddressable
        ? `${frontendUrl}/view/@${component.publishingDomain}`
        : `${frontendUrl}/create/${componentId}`,
    };
  }

  private baseUrl(key: string, fallback: string): string {
    return (this.configService?.get<string>(key) || fallback).replace(
      /\/+$/,
      '',
    );
  }

  private bearerToken(authorization?: string): string {
    if (typeof authorization !== 'string') {
      throw new UnauthorizedException('Bearer CLI token required');
    }
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    if (!match) throw new UnauthorizedException('Bearer CLI token required');
    return match[1];
  }

  private validatePublishStory(
    value: unknown,
  ): PublishStoryDto | PublishStoryV2Dto {
    if (!isPlainObject(value)) throw invalid('Request body must be an object');
    if (value.schemaVersion === 2) return validatePublishStoryV2(value);
    assertKeys(value, [
      'schemaVersion',
      'name',
      'description',
      'publishingName',
      'visibility',
      'language',
      'entry',
      'files',
      'dependencies',
      'stories',
      'provenance',
      'digest',
    ]);
    requireKeys(value, [
      'schemaVersion',
      'name',
      'publishingName',
      'visibility',
      'language',
      'entry',
      'files',
      'dependencies',
      'stories',
      'provenance',
      'digest',
    ]);
    if (value.schemaVersion !== 1) throw invalid('Unsupported schemaVersion');
    assertString(value.name, 'name', 1, 120);
    if (value.description !== undefined)
      assertString(value.description, 'description', 0, 2000);
    if (value.description !== undefined)
      assertNoHighConfidenceSecret(value.description as string, 'description');
    assertString(value.publishingName, 'publishingName', 1, 64);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.publishingName as string)) {
      throw invalid('publishingName must be a lowercase slug');
    }
    if (!['public', 'private', 'unlisted'].includes(value.visibility as string))
      throw invalid('Invalid visibility');
    if (!['tsx', 'jsx', 'ts', 'js'].includes(value.language as string))
      throw invalid('Unsupported Storybook language');
    assertString(value.entry, 'entry', 1, 512);
    assertString(value.digest, 'digest', 64, 64);
    if (!/^[a-f0-9]{64}$/.test(value.digest as string))
      throw invalid('digest must be lowercase SHA-256');

    if (!isPlainObject(value.files)) throw invalid('files must be an object');
    const files = Object.entries(value.files);
    if (!files.length) throw invalid('files must not be empty');
    if (files.length > MAX_STORY_FILES)
      throw invalid(`files exceeds ${MAX_STORY_FILES} entries`);
    let bytes = 0;
    const folded = new Set<string>();
    for (const [filePath, code] of files) {
      validateSourcePath(filePath);
      const key = filePath.normalize('NFC').toLocaleLowerCase('en-US');
      if (folded.has(key))
        throw invalid('files contains a case-fold path collision');
      folded.add(key);
      if (typeof code !== 'string')
        throw invalid(`files.${filePath} must be a string`);
      const fileBytes = Buffer.byteLength(code, 'utf8');
      if (fileBytes > MAX_STORY_FILE_BYTES)
        throw invalid(
          `files.${filePath} exceeds ${MAX_STORY_FILE_BYTES} bytes`,
        );
      validateSourceContent(filePath, code);
      bytes += fileBytes;
      if (bytes > MAX_STORY_BYTES)
        throw invalid(`files exceeds ${MAX_STORY_BYTES} bytes`);
    }
    validateSourcePath(value.entry as string);
    if (
      !Object.prototype.hasOwnProperty.call(value.files, value.entry as string)
    ) {
      throw invalid('entry must identify a supplied file');
    }

    if (!isPlainObject(value.dependencies))
      throw invalid('dependencies must be an object');
    for (const [name, version] of Object.entries(value.dependencies)) {
      if (
        !isDependencyName(name) ||
        typeof version !== 'string' ||
        !version ||
        version.length > 200
      ) {
        throw invalid('dependencies contains an invalid package or version');
      }
    }

    if (
      !Array.isArray(value.stories) ||
      !value.stories.length ||
      value.stories.length > 100
    ) {
      throw invalid('stories must contain between 1 and 100 stories');
    }
    for (const story of value.stories) {
      if (!isPlainObject(story)) throw invalid('Each story must be an object');
      assertKeys(story, ['exportName', 'name', 'args', 'portable']);
      requireKeys(story, ['exportName', 'name', 'portable']);
      assertString(story.exportName, 'stories.exportName', 1, 200);
      assertString(story.name, 'stories.name', 1, 200);
      if (story.portable !== true)
        throw invalid('All stories must be portable');
      if (story.args !== undefined) assertJsonValue(story.args, 'stories.args');
      if (story.args !== undefined)
        assertNoHighConfidenceSecret(canonicalJson(story.args), 'stories.args');
    }

    if (!isPlainObject(value.provenance))
      throw invalid('provenance must be an object');
    assertKeys(value.provenance, ['storyPath', 'gitCommit', 'gitRemote']);
    requireKeys(value.provenance, ['storyPath']);
    assertString(value.provenance.storyPath, 'provenance.storyPath', 1, 1000);
    validateSourcePath(value.provenance.storyPath as string);
    if (value.provenance.gitCommit !== undefined) {
      assertString(value.provenance.gitCommit, 'provenance.gitCommit', 7, 64);
      if (!/^[a-fA-F0-9]{7,64}$/.test(value.provenance.gitCommit as string))
        throw invalid('Invalid gitCommit');
    }
    if (value.provenance.gitRemote !== undefined)
      assertString(value.provenance.gitRemote, 'provenance.gitRemote', 1, 2000);
    return value as unknown as PublishStoryDto;
  }
}

const REGISTRY_ITEM_KEYS = [
  '$schema',
  'name',
  'type',
  'title',
  'description',
  'author',
  'dependencies',
  'devDependencies',
  'registryDependencies',
  'files',
  'tailwind',
  'cssVars',
  'css',
  'docs',
  'categories',
  'meta',
];
const REGISTRY_FILE_KEYS = ['path', 'type', 'target', 'content'];
const MAX_REGISTRY_METADATA_BYTES = 1024 * 1024;

function validateStringArray(value: unknown, field: string, max = 500): void {
  if (!Array.isArray(value) || value.length > max)
    throw invalid(`${field} must be an array with at most ${max} entries`);
  for (const item of value) assertString(item, field, 1, 1000);
}

function validatePublishStoryV2(
  value: Record<string, unknown>,
): PublishStoryV2Dto {
  assertKeys(value, [
    'schemaVersion',
    'publishingName',
    'visibility',
    'language',
    'entry',
    'dependencyVersions',
    'stories',
    'provenance',
    'registryItem',
    'digest',
  ]);
  requireKeys(value, [
    'schemaVersion',
    'publishingName',
    'visibility',
    'language',
    'entry',
    'dependencyVersions',
    'stories',
    'provenance',
    'registryItem',
    'digest',
  ]);
  assertString(value.publishingName, 'publishingName', 1, 64);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.publishingName as string))
    throw invalid('publishingName must be a lowercase slug');
  if (!['public', 'private', 'unlisted'].includes(value.visibility as string))
    throw invalid('Invalid visibility');
  if (!['tsx', 'jsx', 'ts', 'js'].includes(value.language as string))
    throw invalid('Unsupported Storybook language');
  assertString(value.entry, 'entry', 1, 512);
  validateSourcePath(value.entry as string);
  assertString(value.digest, 'digest', 64, 64);
  if (!/^[a-f0-9]{64}$/.test(value.digest as string))
    throw invalid('digest must be lowercase SHA-256');

  if (!isPlainObject(value.dependencyVersions))
    throw invalid('dependencyVersions must be an object');
  if (Object.keys(value.dependencyVersions).length > 500)
    throw invalid('dependencyVersions exceeds 500 entries');
  for (const [name, version] of Object.entries(value.dependencyVersions)) {
    if (
      !isDependencyName(name) ||
      typeof version !== 'string' ||
      !version ||
      version.length > 200
    )
      throw invalid(
        'dependencyVersions contains an invalid package or version',
      );
  }

  if (
    !Array.isArray(value.stories) ||
    !value.stories.length ||
    value.stories.length > 100
  )
    throw invalid('stories must contain between 1 and 100 stories');
  for (const story of value.stories) {
    if (!isPlainObject(story)) throw invalid('Each story must be an object');
    assertKeys(story, ['exportName', 'name', 'args', 'portable']);
    requireKeys(story, ['exportName', 'name', 'portable']);
    assertString(story.exportName, 'stories.exportName', 1, 200);
    assertString(story.name, 'stories.name', 1, 200);
    if (story.portable !== true) throw invalid('All stories must be portable');
    if (story.args !== undefined) assertJsonValue(story.args, 'stories.args');
  }
  if (!isPlainObject(value.provenance))
    throw invalid('provenance must be an object');
  assertKeys(value.provenance, ['storyPath', 'gitCommit', 'gitRemote']);
  requireKeys(value.provenance, ['storyPath']);
  assertString(value.provenance.storyPath, 'provenance.storyPath', 1, 1000);
  validateSourcePath(value.provenance.storyPath as string);
  if (value.provenance.gitCommit !== undefined) {
    assertString(value.provenance.gitCommit, 'provenance.gitCommit', 7, 64);
    if (!/^[a-fA-F0-9]{7,64}$/.test(value.provenance.gitCommit as string))
      throw invalid('Invalid gitCommit');
  }
  if (value.provenance.gitRemote !== undefined)
    assertString(value.provenance.gitRemote, 'provenance.gitRemote', 1, 2000);

  if (!isPlainObject(value.registryItem))
    throw invalid('registryItem must be an object');
  const item = value.registryItem;
  assertKeys(item, REGISTRY_ITEM_KEYS);
  requireKeys(item, ['name', 'type', 'files']);
  if (item.$schema !== undefined) {
    assertString(item.$schema, 'registryItem.$schema', 1, 200);
    if (item.$schema !== 'https://ui.shadcn.com/schema/registry-item.json')
      throw invalid('Unsupported registryItem.$schema');
  }
  assertString(item.name, 'registryItem.name', 1, 120);
  assertString(item.type, 'registryItem.type', 1, 100);
  if (!/^registry:[a-z0-9-]+$/.test(item.type as string))
    throw invalid('Invalid registryItem.type');
  for (const field of [
    'title',
    'description',
    'author',
    'css',
    'docs',
  ] as const) {
    if (item[field] !== undefined)
      assertString(
        item[field],
        `registryItem.${field}`,
        0,
        field === 'css' || field === 'docs'
          ? MAX_REGISTRY_METADATA_BYTES
          : 2000,
      );
  }
  for (const field of [
    'dependencies',
    'devDependencies',
    'registryDependencies',
    'categories',
  ] as const) {
    if (item[field] !== undefined)
      validateStringArray(item[field], `registryItem.${field}`);
  }
  for (const field of ['tailwind', 'cssVars', 'meta'] as const) {
    if (item[field] !== undefined)
      assertJsonValue(item[field], `registryItem.${field}`);
  }
  if (
    !Array.isArray(item.files) ||
    !item.files.length ||
    item.files.length > MAX_STORY_FILES
  )
    throw invalid(
      `registryItem.files must contain between 1 and ${MAX_STORY_FILES} files`,
    );
  let bytes = 0;
  const folded = new Set<string>();
  for (const file of item.files) {
    if (!isPlainObject(file))
      throw invalid('Each registryItem file must be an object');
    assertKeys(file, REGISTRY_FILE_KEYS);
    requireKeys(file, ['path', 'type', 'content']);
    assertString(file.path, 'registryItem.files.path', 1, 512);
    validateSourcePath(file.path as string);
    const key = (file.path as string)
      .normalize('NFC')
      .toLocaleLowerCase('en-US');
    if (folded.has(key))
      throw invalid('registryItem.files contains a case-fold path collision');
    folded.add(key);
    assertString(file.type, 'registryItem.files.type', 1, 100);
    if (!/^registry:[a-z0-9-]+$/.test(file.type as string))
      throw invalid('Invalid registryItem file type');
    if (file.target !== undefined) {
      assertString(file.target, 'registryItem.files.target', 1, 512);
      validateSourcePath(file.target as string);
    }
    if (typeof file.content !== 'string')
      throw invalid('registryItem.files.content must be a string');
    const fileBytes = Buffer.byteLength(file.content, 'utf8');
    if (fileBytes > MAX_STORY_FILE_BYTES)
      throw invalid(`registryItem file exceeds ${MAX_STORY_FILE_BYTES} bytes`);
    validateSourceContent(file.path as string, file.content);
    bytes += fileBytes;
    if (bytes > MAX_STORY_BYTES)
      throw invalid(`registryItem files exceed ${MAX_STORY_BYTES} bytes`);
  }
  if (
    !folded.has(
      (value.entry as string).normalize('NFC').toLocaleLowerCase('en-US'),
    )
  )
    throw invalid('entry must identify a supplied registryItem file');
  // This cap covers every non-file semantic field, including arbitrary meta.
  const metadataOnly = {
    ...item,
    files: item.files.map((file: any) => ({ ...file, content: '' })),
  };
  if (
    Buffer.byteLength(canonicalJson(metadataOnly), 'utf8') >
    MAX_REGISTRY_METADATA_BYTES
  )
    throw invalid(
      `registryItem metadata exceeds ${MAX_REGISTRY_METADATA_BYTES} bytes`,
    );
  assertNoHighConfidenceSecret(
    canonicalJson(metadataOnly),
    'registryItem metadata',
  );
  return value as unknown as PublishStoryV2Dto;
}

export const MAX_STORY_FILES = 500;
export const MAX_STORY_BYTES = 5 * 1024 * 1024;
export const MAX_STORY_FILE_BYTES = 256 * 1024;

function invalid(message: string): BadRequestException {
  return new BadRequestException(message);
}
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}
function assertKeys(value: Record<string, unknown>, allowed: string[]) {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) throw invalid(`Unknown property: ${unknown}`);
}
function requireKeys(value: Record<string, unknown>, required: string[]) {
  const missing = required.find(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (missing) throw invalid(`Missing property: ${missing}`);
}
function assertString(value: unknown, field: string, min: number, max: number) {
  if (
    typeof value !== 'string' ||
    value.length < min ||
    value.length > max ||
    value.includes('\0')
  ) {
    throw invalid(`${field} must be a valid string`);
  }
}
function validateSourcePath(filePath: string) {
  if (
    typeof filePath !== 'string' ||
    filePath.length > 512 ||
    filePath.includes('\\') ||
    !isSafeRegistryPath(filePath) ||
    filePath.split('/').some((part) => !part || part === '.')
  ) {
    throw invalid(`Unsafe file path: ${filePath}`);
  }
  const basename = filePath.split('/').at(-1)!.toLocaleLowerCase('en-US');
  if (
    /^(\.env(?:\..*)?|\.npmrc|\.yarnrc(?:\..*)?|\.pypirc|credentials(?:\.json)?|secrets?(?:\..*)?|id_(?:rsa|dsa|ecdsa|ed25519)|.*\.(?:pem|key|p12|pfx|crt|cer))$/.test(
      basename,
    )
  ) {
    throw invalid(`Secret filename is not allowed: ${filePath}`);
  }
}
const HIGH_CONFIDENCE_SECRET_PATTERNS: RegExp[] = [
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  /\bsk-[A-Za-z0-9_-]{32,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
];
function assertNoHighConfidenceSecret(value: string, field: string) {
  if (HIGH_CONFIDENCE_SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
    throw invalid(`Secret-like credential is not allowed in ${field}`);
  }
}
function validateSourceContent(filePath: string, code: string) {
  assertNoHighConfidenceSecret(code, filePath);
  if (
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(code) ||
    code.includes('\uFFFD')
  ) {
    throw invalid(`Binary or control content is not allowed: ${filePath}`);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(code)) {
    throw invalid(`Private key content is not allowed: ${filePath}`);
  }
}
function isDependencyName(value: string): boolean {
  return (
    value.length <= 214 &&
    /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)$/.test(
      value,
    )
  );
}
function assertJsonValue(value: unknown, field: string, depth = 0): void {
  if (depth > 20) throw invalid(`${field} is too deeply nested`);
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    if (value.length > 10000) throw invalid(`${field} is too large`);
    value.forEach((item) => assertJsonValue(item, field, depth + 1));
    return;
  }
  if (isPlainObject(value)) {
    if (Object.keys(value).length > 10000)
      throw invalid(`${field} is too large`);
    Object.values(value).forEach((item) =>
      assertJsonValue(item, field, depth + 1),
    );
    return;
  }
  throw invalid(`${field} must be JSON-serializable`);
}
function compareText(a: string, b: string): number {
  return a.localeCompare(b);
}
export function normalizePublishStory(input: PublishStoryDto): PublishStoryDto;
export function normalizePublishStory(
  input: PublishStoryV2Dto,
): PublishStoryV2Dto;
export function normalizePublishStory(
  input: PublishStoryDto | PublishStoryV2Dto,
): PublishStoryDto | PublishStoryV2Dto;
export function normalizePublishStory(
  input: PublishStoryDto | PublishStoryV2Dto,
): PublishStoryDto | PublishStoryV2Dto {
  const stories = [...input.stories].sort(
    (a, b) =>
      compareText(a.exportName, b.exportName) || compareText(a.name, b.name),
  );
  if (input.schemaVersion === 2) {
    return {
      ...input,
      dependencyVersions: Object.fromEntries(
        Object.entries(input.dependencyVersions).sort(([a], [b]) =>
          compareText(a, b),
        ),
      ),
      stories,
      registryItem: {
        ...input.registryItem,
        files: input.registryItem.files.map((file) => ({
          ...file,
          content: file.content.replace(/\r\n?/g, '\n'),
        })),
      },
    };
  }
  return {
    ...input,
    files: Object.fromEntries(
      Object.entries(input.files)
        .map(
          ([filePath, code]) =>
            [filePath, code.replace(/\r\n?/g, '\n')] as const,
        )
        .sort(([a], [b]) => compareText(a, b)),
    ),
    dependencies: Object.fromEntries(
      Object.entries(input.dependencies).sort(([a], [b]) => compareText(a, b)),
    ),
    stories,
  };
}
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw invalid('Request contains a non-JSON value');
  return encoded;
}
