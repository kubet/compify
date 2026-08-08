import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Component,
  ComponentVisibility,
} from 'src/entities/project/component.entity';
import { MinioClientService } from '../minio/minio.service';
import { ConfigService } from '@nestjs/config';
import { isSafeRegistryPath } from 'src/common/registry-path';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { ComponentRevision } from 'src/entities/project/component-revision.entity';
import {
  authenticateCliToken,
  bearerCliToken,
} from 'src/common/cli-token-auth';

/**
 * shadcn-compatible registry (https://ui.shadcn.com/docs/registry).
 *
 * Serves shadcn-compatible item JSON for supported public/unlisted source and
 * owner-authenticated private source. Compatibility is version/fixture scoped:
 *   bunx shadcn@4.16.2 add https://api.compify.app/r/<user>/<name>.json
 * or, with `"@compify": "https://api.compify.app/r/{name}.json"` configured
 * in components.json registries:
 *   bunx shadcn@4.16.2 add @compify/<user>/<name>
 */
@ApiTags('Registry')
@Controller('r')
export class RegistryController {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    @InjectRepository(CliToken)
    private cliTokenRepository: Repository<CliToken>,
    private minioService: MinioClientService,
    private configService: ConfigService,
    @InjectRepository(ComponentRevision)
    private componentRevisionRepository?: Repository<ComponentRevision>,
  ) {}

  private get frontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'https://compify.app'
    ).replace(/\/$/, '');
  }

  // Compify-internal files that make no sense inside a consumer project.
  private static readonly EXCLUDED_FILES = [
    '/globals.css',
    '/tailwind.config.js',
    '/tailwind.config.ts',
    '/theme.css',
    '/theme.json',
  ];

  @Get('registry.json')
  async index() {
    const components = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.visibility = :visibility', {
        visibility: ComponentVisibility.PUBLIC,
      })
      .andWhere('component.publishingDomain IS NOT NULL')
      .orderBy('component.upvotesCount', 'DESC')
      .getMany();

    return {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'compify',
      homepage: this.frontendUrl,
      items: components.map((component) => ({
        name: component.publishingDomain.replace(/^compify\//, ''),
        type: 'registry:component',
        title: component.name,
        description: component.description || undefined,
      })),
    };
  }

  // Official components live under the "compify" handle and resolve from the
  // short form too: /r/glass-3d-text.json === /r/compify/glass-3d-text.json.
  @Get(':name.json')
  @ApiBearerAuth('cli-bearer')
  async officialItem(
    @Param('name') name: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.buildItem(`compify/${name}`, name, authorization);
  }

  @Get(':username/:name.json')
  @ApiBearerAuth('cli-bearer')
  async item(
    @Param('username') username: string,
    @Param('name') name: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.buildItem(`${username}/${name}`, undefined, authorization);
  }

  @Get(':username/:name/:digest.json')
  @ApiBearerAuth('cli-bearer')
  async revisionItem(
    @Param('username') username: string,
    @Param('name') name: string,
    @Param('digest') digest: string,
    @Headers('authorization') authorization?: string,
  ) {
    if (!/^[a-f0-9]{64}$/.test(digest)) {
      throw new NotFoundException(
        `Component "@${username}/${name}" revision not found`,
      );
    }
    return this.buildItem(
      `${username}/${name}`,
      undefined,
      authorization,
      digest,
    );
  }

  @Get(':username/:name')
  @ApiBearerAuth('cli-bearer')
  async itemNoExt(
    @Param('username') username: string,
    @Param('name') name: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.buildItem(
      `${username}/${name.replace(/\.json$/, '')}`,
      undefined,
      authorization,
    );
  }

  private async buildItem(
    publishingDomain: string,
    displayName?: string,
    authorization?: string,
    digest?: string,
  ) {
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.publishingDomain = :publishingDomain', {
        publishingDomain,
      })
      .getOne();

    if (!component) {
      throw new NotFoundException(`Component "@${publishingDomain}" not found`);
    }
    const revision = this.componentRevisionRepository
      ? await this.componentRevisionRepository.findOne(
          digest
            ? { where: { component: { id: component.id }, digest } }
            : {
                where: { component: { id: component.id } },
                order: { revision: 'DESC' },
              },
        )
      : undefined;
    if (digest && (!revision || revision.schemaVersion !== 2)) {
      throw new NotFoundException(
        `Component "@${publishingDomain}" revision not found`,
      );
    }
    const visibility = revision?.visibility || component.visibility;
    if (visibility === ComponentVisibility.PRIVATE) {
      // Private items and private historical revisions remain accessible only
      // to the owning CLI token, even if a later revision becomes public.
      // Missing or invalid credentials intentionally look like a missing item
      // so callers cannot enumerate private publishing domains.
      try {
        const user = await authenticateCliToken(
          this.cliTokenRepository,
          bearerCliToken(authorization),
        );
        if (!component.user || component.user.id !== user.id) {
          throw new Error('owner mismatch');
        }
      } catch {
        throw new NotFoundException(
          `Component "@${publishingDomain}" not found`,
        );
      }
    } else if (
      visibility !== ComponentVisibility.PUBLIC &&
      visibility !== ComponentVisibility.FREE
    ) {
      throw new NotFoundException(`Component "@${publishingDomain}" not found`);
    }

    if (revision) return revision.registryItem;

    const latestStorybook = (component.pageSettings as any)?.storybook;
    if (
      latestStorybook?.schemaVersion === 2 &&
      latestStorybook.registryItem &&
      typeof latestStorybook.registryItem === 'object' &&
      !Array.isArray(latestStorybook.registryItem)
    ) {
      return latestStorybook.registryItem;
    }

    const raw =
      (
        await this.minioService.getFile('components', component.id)
      )?.buffer?.toString() || '{}';
    let files: Record<string, { code?: unknown }>;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Component source is not a file map');
      }
      files = parsed as Record<string, { code?: unknown }>;
    } catch {
      throw new NotFoundException(
        `Component "@${publishingDomain}" source is unavailable`,
      );
    }

    // Dependency names only (no version pins): the editor pins versions for
    // its own sandbox runtime, but consumer projects must resolve versions
    // compatible with their own react.
    const deps = new Set<string>();
    const usedDeps = component.usedDeps || {};
    for (const depName of Object.keys(usedDeps.global || {})) {
      if (depName === 'tailwindcss') continue;
      deps.add(depName);
    }
    for (const fileDeps of Object.values(usedDeps.files || {})) {
      for (const depName of Object.keys(fileDeps as object)) {
        if (depName === 'tailwindcss') continue;
        deps.add(depName);
      }
    }

    const storybook = latestStorybook;
    if (
      storybook &&
      storybook.schemaVersion === 1 &&
      typeof storybook.entry === 'string' &&
      typeof storybook.digest === 'string' &&
      Array.isArray(storybook.stories) &&
      storybook.provenance &&
      typeof storybook.provenance === 'object'
    ) {
      // CLI-published artifacts are already reviewed source graphs. Preserve
      // their paths and Compify metadata instead of applying the legacy browser
      // editor's second, incompatible path transformation.
      return {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: component.name,
        type: 'registry:component',
        description: component.description || undefined,
        dependencies: [...deps],
        files: Object.entries(files)
          .filter(
            ([path, file]: [string, any]) =>
              isSafeRegistryPath(path.replace(/^\//, '')) &&
              typeof file?.code === 'string',
          )
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([path, file]: [string, any]) => ({
            path: path.replace(/^\//, ''),
            type: 'registry:component',
            content: file.code,
          })),
        meta: { compify: storybook },
      };
    }

    const itemName = publishingDomain.split('/')[1];
    const author = component.user?.username
      ? `@${component.user.username} (${this.frontendUrl})`
      : undefined;

    return {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: displayName || publishingDomain,
      type: 'registry:component',
      title: component.name,
      description: component.description || undefined,
      author,
      dependencies: [...deps],
      files: Object.entries(files)
        .filter(
          ([path, file]: [string, any]) =>
            !RegistryController.EXCLUDED_FILES.includes(path) &&
            isSafeRegistryPath(path.replace(/^\//, '')) &&
            typeof file?.code === 'string',
        )
        .map(([path, file]: [string, any]) => {
          // Generic editor filenames (App.js, Untitled1.tsx) become the
          // component's slug so consumer projects get meaningful files.
          const ext = path.split('.').pop();
          const base = path.replace(/^\//, '').replace(/\.[^.]+$/, '');
          const generic = /^(App|Untitled\d*|Test\d*)$/i.test(base);
          const fileName = generic
            ? `${itemName}.${ext}`
            : path.replace(/^\//, '');
          return {
            path: `registry/${itemName}/${fileName}`,
            type: 'registry:component',
            content: file.code,
          };
        }),
      docs: `Preview and customize at ${this.frontendUrl}/view/@${publishingDomain}`,
      meta: {
        source: `${this.frontendUrl}/view/@${publishingDomain}`,
      },
    };
  }
}
