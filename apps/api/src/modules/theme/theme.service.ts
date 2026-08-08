import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theme } from '../../entities/project/theme.entity';
import { User } from '../../entities/user/user.entity';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import {
  Component,
  ComponentVisibility,
} from 'src/entities/project/component.entity';
import { shortIdToUuid, uuidToShortId } from 'src/common/short-id';
import {
  projectThemeContent,
  themeContentBytes,
  THEME_CONTENT_MAX_BYTES,
} from 'src/common/theme-content';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(Theme)
    private themeRepository: Repository<Theme>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
  ) {}

  private parseId(id: string): string {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
      ? id.toLowerCase()
      : shortIdToUuid(id);
  }

  private async findOwnedComponent(componentId: string, user: User) {
    const component = await this.componentRepository.findOne({
      where: { id: this.parseId(componentId), user: { id: user.id } },
    });
    if (!component) {
      throw new NotFoundException('Component not found');
    }
    return component;
  }

  private async findOwnedTheme(id: string, user: User) {
    const theme = await this.themeRepository.findOne({
      where: {
        id: this.parseId(id),
        component: { user: { id: user.id } },
      },
      relations: ['component'],
    });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }
    return theme;
  }

  async findOne(id: string, user: User) {
    const theme = await this.themeRepository.findOne({
      where: { id: this.parseId(id) },
      relations: ['component'],
    });
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    if (
      theme.component?.visibility !== ComponentVisibility.PUBLIC &&
      theme.component?.visibility !== ComponentVisibility.FREE
    ) {
      await this.findOwnedTheme(id, user);
    }
    return {
      ...theme,
      id: uuidToShortId(theme.id),
    };
  }

  async checkIfUserCanDoAction(id: string, user: User, componentId?: string) {
    if (id) {
      const theme = await this.findOwnedTheme(id, user);
      if (componentId && this.parseId(componentId) !== theme.component?.id) {
        throw new BadRequestException(
          'A theme cannot be moved to another component',
        );
      }
      return theme;
    }

    if (!componentId) {
      throw new BadRequestException('componentId is required');
    }
    return this.findOwnedComponent(componentId, user);
  }

  private ownedThemeWhere(): string {
    return `"id" = :id AND "componentId" IN (
      SELECT "id" FROM "component"
      WHERE "userId" = :userId AND "deletedAt" IS NULL
    )`;
  }

  private async throwCasMiss(id: string, user: User): Promise<never> {
    await this.findOwnedTheme(id, user);
    throw new ConflictException(
      'This theme changed in another tab. Reload it before saving again.',
    );
  }

  async delete(id: string, user: User, expectedVersion: number) {
    const parsedId = this.parseId(id);
    const result = await this.themeRepository
      .createQueryBuilder()
      .delete()
      .from(Theme)
      .where(this.ownedThemeWhere(), { id: parsedId, userId: user.id })
      .andWhere(`"version" = :expectedVersion`, { expectedVersion })
      .execute();

    if (!result.affected) {
      await this.throwCasMiss(id, user);
    }
    return { id: uuidToShortId(parsedId) };
  }

  async createOrUpdate(
    themeData: InsertThemeDto,
    user: User,
    expectedVersion?: number,
  ) {
    if (themeData?.id === 'null') {
      delete themeData.id;
    }
    const authorizedEntity = await this.checkIfUserCanDoAction(
      themeData.id,
      user,
      themeData.componentId,
    );
    const existingTheme = themeData.id
      ? (authorizedEntity as Theme)
      : undefined;
    if (existingTheme) {
      if (expectedVersion == null) {
        throw new BadRequestException('An expected theme version is required');
      }
      if (expectedVersion !== existingTheme.version) {
        throw new ConflictException(
          'This theme changed in another tab. Reload it before saving again.',
        );
      }
    }
    const prospectiveContent = {
      factors: themeData.factors ?? existingTheme?.factors ?? [],
      groups: themeData.groups ?? existingTheme?.groups ?? {},
      values: themeData.values ?? existingTheme?.values ?? [],
    };
    if (themeContentBytes(prospectiveContent) > THEME_CONTENT_MAX_BYTES) {
      throw new BadRequestException(
        `Theme size exceeds the maximum allowed limit (${THEME_CONTENT_MAX_BYTES} bytes)`,
      );
    }
    let content;
    try {
      content = projectThemeContent(prospectiveContent);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid theme content',
      );
    }
    if (themeContentBytes(content) > THEME_CONTENT_MAX_BYTES) {
      throw new BadRequestException(
        `Theme size exceeds the maximum allowed limit (${THEME_CONTENT_MAX_BYTES} bytes)`,
      );
    }

    if (themeData.id) {
      const theme = authorizedEntity as Theme;
      const changes: Record<string, unknown> = {
        version: () => `"version" + 1`,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      };
      if (themeData.name != null) changes.name = themeData.name;
      // Always rewrite every collection so legacy compiler-derived fields are
      // removed even when the HTTP patch changes only metadata.
      changes.groups = content.groups;
      changes.factors = content.factors;
      changes.values = content.values;

      const result = await this.themeRepository
        .createQueryBuilder()
        .update(Theme)
        .set(changes)
        .where(this.ownedThemeWhere(), {
          id: theme.id,
          userId: user.id,
        })
        .andWhere(`"version" = :expectedVersion`, { expectedVersion })
        .returning('*')
        .execute();
      if (!result.affected) {
        await this.throwCasMiss(themeData.id, user);
      }

      const row = result.raw[0] as Record<string, unknown>;
      return {
        ...theme,
        name: row.name,
        groups: row.groups,
        factors: row.factors,
        values: row.values,
        version: Number(row.version),
        createdAt: (row.created_at ?? row.createdAt) as Date,
        updatedAt: (row.updated_at ?? row.updatedAt) as Date,
        id: uuidToShortId(theme.id),
      };
    }

    const theme = new Theme();
    theme.name = themeData.name || 'Default';
    theme.component = authorizedEntity as Component;
    theme.componentId = theme.component.id;
    theme.groups = content.groups;
    theme.factors = content.factors;
    theme.values = content.values;

    let savedTheme: Theme;
    try {
      savedTheme = await this.themeRepository.save(theme);
    } catch (error) {
      const driverError = (error as { driverError?: Record<string, string> })
        ?.driverError;
      if (
        driverError?.code === '23505' &&
        driverError?.constraint === 'UQ_themes_component'
      ) {
        throw new ConflictException(
          'A theme already exists for this component',
        );
      }
      throw error;
    }
    return {
      ...savedTheme,
      id: uuidToShortId(savedTheme.id),
    };
  }
}
