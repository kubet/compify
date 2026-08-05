import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Component,
  ComponentVisibility,
} from 'src/entities/project/component.entity';
import { MinioClientService } from '../minio/minio.service';

/**
 * shadcn-compatible registry (https://ui.shadcn.com/docs/registry).
 *
 * Any published component is installable into any shadcn project:
 *   npx shadcn@latest add https://api.compify.app/r/<user>/<name>.json
 * or, with `"@compify": "https://api.compify.app/r/{name}.json"` configured
 * in components.json registries:
 *   npx shadcn@latest add @compify/<user>/<name>
 */
@Controller('r')
export class RegistryController {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    private minioService: MinioClientService,
  ) {}

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
      .where('component.visibility IN (:...vis)', {
        vis: [ComponentVisibility.PUBLIC, ComponentVisibility.FREE],
      })
      .andWhere('component.publishingDomain IS NOT NULL')
      .orderBy('component.upvotesCount', 'DESC')
      .getMany();

    return {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'compify',
      homepage: 'https://compify.app',
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
  async officialItem(@Param('name') name: string) {
    return this.buildItem(`compify/${name}`, name);
  }

  @Get(':username/:name.json')
  async item(@Param('username') username: string, @Param('name') name: string) {
    return this.buildItem(`${username}/${name}`);
  }

  @Get(':username/:name')
  async itemNoExt(
    @Param('username') username: string,
    @Param('name') name: string,
  ) {
    return this.buildItem(`${username}/${name.replace(/\.json$/, '')}`);
  }

  private async buildItem(publishingDomain: string, displayName?: string) {
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.publishingDomain = :publishingDomain', {
        publishingDomain,
      })
      .getOne();

    if (
      !component ||
      (component.visibility !== ComponentVisibility.PUBLIC &&
        component.visibility !== ComponentVisibility.FREE)
    ) {
      throw new NotFoundException(`Component "@${publishingDomain}" not found`);
    }

    const raw =
      (
        await this.minioService.getFile('components', component.id)
      )?.buffer?.toString() || '{}';
    const files = JSON.parse(raw);

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

    const itemName = publishingDomain.split('/')[1];
    const author = component.user?.username
      ? `@${component.user.username} (https://compify.app)`
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
            typeof file?.code === 'string',
        )
        .map(([path, file]: [string, any]) => ({
          path: `registry/${itemName}${path}`,
          type: 'registry:component',
          content: file.code,
        })),
      docs: `Preview and customize at https://compify.app/view/@${publishingDomain}`,
      meta: {
        source: `https://compify.app/view/@${publishingDomain}`,
      },
    };
  }
}
