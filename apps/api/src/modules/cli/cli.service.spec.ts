import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  canonicalJson,
  CliService,
  MAX_STORY_BYTES,
  normalizePublishStory,
} from './cli.service';

const VALID_TOKEN = `cli_${'a'.repeat(64)}`;

function serviceWith(...entities: any[]) {
  const builders: any[] = [];
  const tokenRepo: any = {
    createQueryBuilder: jest.fn().mockImplementation(() => {
      const queryBuilder: any = {
        addSelect: jest.fn(),
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        getOne: jest.fn().mockResolvedValue(entities.shift() ?? null),
      };
      for (const method of ['addSelect', 'leftJoinAndSelect', 'where'])
        queryBuilder[method].mockReturnValue(queryBuilder);
      builders.push(queryBuilder);
      return queryBuilder;
    }),
    save: jest.fn().mockImplementation(async (entity) => entity),
  };
  return {
    service: new CliService(
      {} as any,
      tokenRepo,
      {} as any,
      {} as any,
      {} as any,
    ),
    builders,
    tokenRepo,
  };
}

describe('CliService token storage', () => {
  it('matches a digest, upgrades a valid legacy raw token and updates last-used time', async () => {
    const entity = {
      token: VALID_TOKEN,
      user: { id: 'user-1' },
      lastUsedAt: new Date(0),
    };
    const { service, tokenRepo } = serviceWith(null, entity);
    await expect(service.getUserByCliToken(VALID_TOKEN)).resolves.toEqual(
      entity.user,
    );
    const digest = createHash('sha256').update(VALID_TOKEN).digest('hex');
    const builders = tokenRepo.createQueryBuilder.mock.results.map(
      (result) => result.value,
    );
    expect(builders[0].where).toHaveBeenCalledWith('cliToken.token = :token', {
      token: digest,
    });
    expect(builders[1].where).toHaveBeenCalledWith('cliToken.token = :token', {
      token: VALID_TOKEN,
    });
    expect(entity.token).toBe(digest);
    expect(entity.lastUsedAt.getTime()).toBeGreaterThan(0);
    expect(tokenRepo.save).toHaveBeenCalledWith(entity);
  });

  it('rejects presenting a stored digest as a bearer credential', async () => {
    const storedDigest = createHash('sha256').update(VALID_TOKEN).digest('hex');
    const { service, tokenRepo } = serviceWith({ user: { id: 'attacker' } });
    await expect(
      service.getUserByCliToken(storedDigest),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokenRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects malformed and unknown tokens', async () => {
    await expect(
      serviceWith().service.getUserByCliToken('cli_secret'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      serviceWith(null, null).service.getUserByCliToken(VALID_TOKEN),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('CliService Storybook publishing', () => {
  function harness() {
    const queryBuilder: any = {
      addSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue({
        token: 'hash',
        user: { id: 'user-1', username: 'alice' },
      }),
    };
    for (const method of ['addSelect', 'leftJoinAndSelect', 'where'])
      queryBuilder[method].mockReturnValue(queryBuilder);
    const componentService = {
      create: jest
        .fn()
        .mockResolvedValue({ id: 'short-id', publishingDomain: 'alice/card' }),
    };
    const service = new CliService(
      {} as any,
      { createQueryBuilder: () => queryBuilder, save: jest.fn() } as any,
      {} as any,
      componentService as any,
      {
        get: (key: string) =>
          key === 'BACKEND_URL' ? 'https://api.test/' : 'https://web.test/',
      } as any,
    );
    return { service, componentService };
  }

  function request(overrides: Record<string, unknown> = {}) {
    const unsigned: any = {
      schemaVersion: 1,
      name: 'Button',
      publishingName: 'button',
      visibility: 'public',
      language: 'tsx',
      entry: 'src/Button.stories.tsx',
      files: {
        'src/Button.tsx': 'export const Button = () => <button />;\r\n',
        'src/Button.stories.tsx': 'export default {};\r\n',
      },
      dependencies: { react: '^18.3.0' },
      stories: [{ exportName: 'Primary', name: 'Primary', portable: true }],
      provenance: { storyPath: 'src/Button.stories.tsx' },
      ...overrides,
    };
    const normalized = normalizePublishStory({
      ...unsigned,
      digest: '0'.repeat(64),
    } as any);
    const canonical = { ...normalized };
    delete (canonical as { digest?: string }).digest;
    return {
      ...unsigned,
      digest: createHash('sha256')
        .update(canonicalJson(canonical))
        .digest('hex'),
    };
  }

  it('has a stable normalization digest test vector', () => {
    expect(request().digest).toBe(
      '32959da36629b2f31e4d2a8b4db1ad67aaf66a681cfe34e55c6dd645c64face2',
    );
  });

  it('matches the CLI digest contract vector', () => {
    const unsigned = {
      schemaVersion: 1,
      name: 'vector',
      publishingName: 'vector',
      visibility: 'public',
      language: 'js',
      entry: 'Vector.js',
      files: { 'Vector.js': 'export const Vector = () => null\n' },
      dependencies: {},
      stories: [
        {
          exportName: 'Basic',
          name: 'Basic',
          args: { text: 'hello', n: 1 },
          portable: true,
        },
      ],
      provenance: { storyPath: 'Vector.stories.js' },
    };
    expect(
      createHash('sha256').update(canonicalJson(unsigned)).digest('hex'),
    ).toBe('bacb55f15f87c8413e94c1a01dcf3f5266f775b2de62e02f1104ae09f7953a36');
  });

  it('authenticates a bearer CLI token and maps the component safely', async () => {
    const { service, componentService } = harness();
    await expect(
      service.publishStory(request(), `Bearer ${VALID_TOKEN}`),
    ).resolves.toEqual({
      componentId: 'short-id',
      publishingDomain: 'alice/card',
      digest: request().digest,
      registryUrl: 'https://api.test/r/alice/card.json',
      previewUrl: 'https://web.test/view/@alice/card',
    });
    const dto = componentService.create.mock.calls[0][0];
    expect(JSON.parse(dto.code)['src/Button.tsx']).toEqual({
      code: 'export const Button = () => <button />;\n',
    });
    expect(dto.usedDeps).toEqual({ global: { react: '^18.3.0' }, files: {} });
    expect(dto.pageSettings.storybook.digest).toBe(request().digest);
  });

  it('maps unlisted stories to the installable non-gallery visibility', async () => {
    const { service, componentService } = harness();
    await service.publishStory(
      request({ visibility: 'unlisted' }),
      `Bearer ${VALID_TOKEN}`,
    );
    expect(componentService.create.mock.calls[0][0].visibility).toBe('free');
  });

  it('returns an authenticated registry URL and private owner preview', async () => {
    const { service } = harness();
    await expect(
      service.publishStory(
        request({ visibility: 'private' }),
        `Bearer ${VALID_TOKEN}`,
      ),
    ).resolves.toMatchObject({
      registryUrl: 'https://api.test/r/alice/card.json',
      previewUrl: 'https://web.test/create/short-id',
    });
  });

  it.each([
    ['src/control.ts', 'ok\u0000bad'],
    ['src/key.ts', '-----BEGIN PRIVATE KEY-----\nsecret'],
  ])('rejects binary or secret source content in %s', async (file, content) => {
    const { service } = harness();
    await expect(
      service.publishStory(
        request({
          files: {
            'src/Button.stories.tsx': 'export default {}',
            [file]: content,
          },
        }),
        `Bearer ${VALID_TOKEN}`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects high-confidence credentials in files, description, and static args', async () => {
    const secrets = [
      `AKIA${'A'.repeat(16)}`,
      `sk_live_${'a'.repeat(24)}`,
      `ghp_${'A'.repeat(36)}`,
      `github_pat_${'A'.repeat(30)}`,
      `sk-proj-${'A'.repeat(30)}`,
      `xoxb-${'A'.repeat(20)}`,
      `AIza${'A'.repeat(35)}`,
    ];
    for (const secret of secrets) {
      for (const overrides of [
        {
          files: {
            'src/Button.stories.tsx': 'export default {}',
            'src/x.ts': secret,
          },
        },
        { description: `credential ${secret}` },
        {
          stories: [
            {
              exportName: 'Primary',
              name: 'Primary',
              args: { token: secret },
              portable: true,
            },
          ],
        },
      ]) {
        const { service } = harness();
        await expect(
          service.publishStory(request(overrides), `Bearer ${VALID_TOKEN}`),
        ).rejects.toBeInstanceOf(BadRequestException);
      }
    }
  });

  it('rejects a forged digest before storing', async () => {
    const { service, componentService } = harness();
    await expect(
      service.publishStory(
        { ...request(), digest: '0'.repeat(64) },
        `Bearer ${VALID_TOKEN}`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(componentService.create).not.toHaveBeenCalled();
  });

  it('rejects traversal and secret filenames', async () => {
    for (const path of ['../secret.tsx', '.env']) {
      const { service } = harness();
      const files = {
        [path]: 'secret',
        'src/Button.stories.tsx': 'export default {}',
      };
      await expect(
        service.publishStory(request({ files }), `Bearer ${VALID_TOKEN}`),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('rejects oversized requests', async () => {
    const { service } = harness();
    await expect(
      service.publishStory(
        request({
          files: {
            'src/Button.stories.tsx': 'x'.repeat(MAX_STORY_BYTES + 1),
          },
        }),
        `Bearer ${VALID_TOKEN}`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects nonportable stories', async () => {
    const { service, componentService } = harness();
    await expect(
      service.publishStory(
        request({
          stories: [
            { exportName: 'Primary', name: 'Primary', portable: false },
          ],
        }),
        `Bearer ${VALID_TOKEN}`,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(componentService.create).not.toHaveBeenCalled();
  });
});
