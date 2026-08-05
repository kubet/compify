import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Theme } from '../../entities/project/theme.entity';
import { User } from '../../entities/user/user.entity';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import { Component, ComponentVisibility } from 'src/entities/project/component.entity';
import { shortIdToUuid, uuidToShortId } from 'src/common/short-id';

@Injectable()
export class ThemeService {
  constructor(
    @InjectRepository(Theme)
    private themeRepository: Repository<Theme>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
  ) {}

  async findOne(id: string, user: User) {
    const theme = await this.themeRepository.findOne({
      where: { id: shortIdToUuid(id) },
      relations: ['component'],
    });

    if(theme?.component?.visibility !== ComponentVisibility.PUBLIC) {
      await this.checkIfUserCanDoAction(id, user);
    }
    return {
      ...theme,
      id: uuidToShortId(theme?.id),
    };
  }


  async checkIfUserCanDoAction(id: string, user: User, componentId?: string) {
    if(!id){
      if (!componentId) {
        return; // No ID to check against
      }
      
      // Check if componentId is already a UUID
      const compId = componentId.includes('-') ? componentId : shortIdToUuid(componentId);
      
      const component = await this.componentRepository.createQueryBuilder('component')
        .leftJoinAndSelect('component.user', 'user')
        .where('component.id = :componentId', { componentId: compId })
        .andWhere('user.id = :userId', { userId: user.id })
        .getOne();
      if (component?.user?.id !== user?.id) {
        throw new BadRequestException('You are not allowed to modify this theme');
      }
      return;
    }

    // Check if id is already a UUID
    const themeId = id.includes('-') ? id : shortIdToUuid(id);
    console.log(themeId);
    const theme = await this.themeRepository.createQueryBuilder('theme')
      .leftJoinAndSelect('theme.component', 'component')
      .leftJoinAndSelect('component.user', 'user')
      .where('theme.id = :id', { id: themeId })
      .andWhere('user.id = :userId', { userId: user.id })
      .getOne();
    console.log(theme?.component?.user?.id, user?.id);
    if (theme?.component?.user?.id !== user?.id) {
      throw new BadRequestException('You are not allowed to modify this theme');
    }
  }

  async delete(id: string, user: User) {
    await this.checkIfUserCanDoAction(id, user);
    const theme = await this.themeRepository.findOne({
      where: { id: shortIdToUuid(id) },
    });
    return await this.themeRepository.remove(theme);
  }

  async createOrUpdate(themeData: InsertThemeDto, user: User) {
    if(themeData?.id === 'null') {
      delete themeData.id;
    }
    await this.checkIfUserCanDoAction(themeData.id, user, themeData?.componentId);
    const dtoSize = Buffer.from(JSON.stringify(themeData))?.length;
    const maxSize = 1 * 1024 * 1024;
    if (dtoSize > maxSize) {
      throw new BadRequestException(
        `Theme size exceeds the maximum allowed limit (${maxSize}MB)`,
      );
    }
    const theme = new Theme();
    if (themeData.id) {
      theme.id = shortIdToUuid(themeData.id);
    }
    theme.name = themeData?.name || 'Default';
    if (themeData?.componentId) {
      theme.component = {
        id: shortIdToUuid(themeData?.componentId),
      } as Component;
    }
    theme.groups = themeData?.groups;
    theme.factors = themeData?.factors;
    theme.values = themeData?.values;
    console.log(theme);
    const savedTheme = await this.themeRepository.save(theme);

    return {
      ...savedTheme,
      id: uuidToShortId(savedTheme?.id),
    };
  }
}
