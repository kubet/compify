import {
  BadRequestException,
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

  async delete(id: string, user: User) {
    const theme = (await this.checkIfUserCanDoAction(id, user)) as Theme;
    return this.themeRepository.remove(theme);
  }

  async createOrUpdate(themeData: InsertThemeDto, user: User) {
    if (themeData?.id === 'null') {
      delete themeData.id;
    }
    const authorizedEntity = await this.checkIfUserCanDoAction(
      themeData.id,
      user,
      themeData.componentId,
    );
    const dtoSize = Buffer.from(JSON.stringify(themeData)).length;
    const maxSize = 1 * 1024 * 1024;
    if (dtoSize > maxSize) {
      throw new BadRequestException(
        `Theme size exceeds the maximum allowed limit (${maxSize} bytes)`,
      );
    }

    const theme = themeData.id ? (authorizedEntity as Theme) : new Theme();
    if (!themeData.id) {
      theme.name = themeData.name || 'Default';
      theme.component = authorizedEntity as Component;
    } else if (themeData.name != null) {
      theme.name = themeData.name;
    }
    if (themeData.groups != null) theme.groups = themeData.groups;
    else if (!themeData.id) theme.groups = {};
    if (themeData.factors != null) theme.factors = themeData.factors;
    else if (!themeData.id) theme.factors = [];
    if (themeData.values != null) theme.values = themeData.values;
    else if (!themeData.id) theme.values = [];

    const savedTheme = await this.themeRepository.save(theme);
    return {
      ...savedTheme,
      id: uuidToShortId(savedTheme.id),
    };
  }
}
