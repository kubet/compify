import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Not, Repository } from 'typeorm';
import {
  Component,
  ComponentVisibility,
  RuntimeLanguage,
} from 'src/entities/project/component.entity';
import { User } from 'src/entities/user/user.entity';
import { CreateComponentDto } from 'src/models/component/create-component.dto';
import { batchProcessIds, shortIdToUuid, uuidToShortId } from 'src/common/short-id';
import { ConstructImageService } from './construct-image.service';
import { MinioClientService } from '../minio/minio.service';
import { LimiterService } from '../limiter/limiter.service';
import { Theme } from 'src/entities/project/theme.entity';
import { ExternalComponent } from 'src/entities/project/externalComponent.entity';
import { Report, ReportItemType } from 'src/entities/common/report.entity';
import { Upvote, UpvoteStatus } from 'src/entities/project/upvote.entity';
@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    private constructImageService: ConstructImageService,
    @InjectRepository(Theme)
    private themeRepository: Repository<Theme>,
    @InjectRepository(ExternalComponent)
    private externalComponentRepository: Repository<ExternalComponent>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private minioService: MinioClientService,
    private limiterService: LimiterService,
    @InjectRepository(Upvote)
    private upvoteRepository: Repository<Upvote>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async reportComponent(id: string, reason: string, user: User) {
    const shortId = shortIdToUuid(id);
    await this.reportRepository.save({
      itemId: shortId,
      itemType: ReportItemType.COMPONENT,
      user,
      reason,
    });
  }

  async findComponentDetailsById(id: string, user: User) {
    return this.componentRepository.findOne({
      where: { id, user },
    });
  }

  async findRecentMy(user: User) {
    const components = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.userId = :userId', { userId: user.id })
      .orderBy('component.createdAt', 'DESC')
      .limit(1)
      .getMany();
    return {
      recent: components.map((component) => ({
        id: uuidToShortId(component.id),
        name: component.name,
      })),
      preference: user?.languagePreferences,
    };
  }
  async share(id: string, user: User) {
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.id = :id and component.user.id = :userId', {
        id: shortIdToUuid(id),
        userId: user.id,
      })
      .getOne();
    if (!component) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }
    component.isShared = true;
    if (component.visibility === ComponentVisibility.PUBLIC) {
      await this.constructImageService.constructOGImage(
        id,
        component.name,
        user.firstName,
        user.lastName,
      );
    }
    await this.componentRepository.save(component);
    return { id };
  }

  async getTopComponents() {
    const components = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.visibility = :visibility', { visibility: ComponentVisibility.PUBLIC })
      .orderBy('component.upvotesCount', 'DESC')
      .limit(6)
      .getMany();
    return components.map((component) => ({
      id: uuidToShortId(component.id),
      name: component.name,
      upvotes: component.upvotesCount,
      language: component.language,
      imageUploaded: component.imageUploaded,
    }));
  }

  async getAllComponentIdsForSitemap(): Promise<object[]> {
    // Only select the id field to minimize data transfer
    const components = await this.componentRepository
      .createQueryBuilder('component')
      .select(['component.id', 'component.name'])
      .where('component.visibility = :visibility', { 
        visibility: ComponentVisibility.PUBLIC 
      })
      .getMany();


    return batchProcessIds(components);
  }

  async checkIfUserIsOwnerOrThrow403(id: string, user: User) {
    const component = await this.componentRepository.findOne({
      where: { id: shortIdToUuid(id), user: { id: user.id } },
    });
    if (!component) {
      throw new ForbiddenException();
    }
  }
  async checkIfComponentIsPublicOrThrow404(id: string) {
    const component = await this.componentRepository.findOne({
      where: { id: shortIdToUuid(id) },
    });
    if (component?.visibility !== ComponentVisibility.PUBLIC || !component?.id) {
      throw new NotFoundException(`Not found`);
    }
  }
  async getPublicComponent(id: string) {
    const component = await this.componentRepository.findOne({
      where: { id: shortIdToUuid(id) },
    });
    if (
      component?.visibility !== ComponentVisibility.PUBLIC ||
      !component?.id
    ) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }
    return {
      name: component.name,
      description: component.description,
      language: component.language,
      usedUiFrameworks: component.usedUiFrameworks,
      upvotesCount: component.upvotesCount,
    };
  }

  async search(
    body: {
      query: string;
      page: number;
      selectedOption?: string[];
      selectedTags?: string[];
    },
    user: User,
  ) {
    const query = body.query?.toString() || '';
    const page = Math.max(0, parseInt(body.page?.toString() || '0'));
    const selectedLanguages = Array.isArray(body.selectedOption)
      ? body.selectedOption.filter((lang) =>
          Object.values(RuntimeLanguage).includes(lang as RuntimeLanguage),
        )
      : [];
    const selectedFrameworks = Array.isArray(body.selectedTags)
      ? body.selectedTags.map((tag) => tag.toString())
      : [];

    const baseQuery = this.componentRepository
      .createQueryBuilder('component')
      .leftJoin('component.upvotes', 'upvotes', 'upvotes.userId = :userId', {
        userId: user.id,
      });

    // Use trigram similarity for better text search
    const whereConditions = ['component.visibility = :visibility'];

    if (query) {
      whereConditions.push('similarity(component.name, :query) > 0.1');
    }

    const queryParams: any = {
      visibility: ComponentVisibility.PUBLIC,
      query,
    };

    if (selectedLanguages.length > 0) {
      whereConditions.push('component.language = ANY(:languages)');
      queryParams.languages = selectedLanguages;
    }

    if (selectedFrameworks.length > 0) {
      whereConditions.push(
        'component."usedUiFrameworks" ?| array[:...frameworks]',
      );
      queryParams.frameworks = selectedFrameworks;
    }

    // Get items and total count in one query
    const result = await baseQuery
      .where(whereConditions.join(' AND '), queryParams)
      .select([
        'component.id as id',
        'component.name as name',
        'upvotes.status as status',
        'component.upvotesCount as "upvotesCount"',
        'component.language as language',
        'component.imageUploaded as "imageUploaded"',
        'component."usedUiFrameworks" as "usedUiFrameworks"',
        'COUNT(*) OVER() as total_count',
      ])
      .orderBy(
        query
          ? 'similarity(component.name, :query)'
          : 'component."upvotesCount"',
        'DESC',
      )
      .offset(page * 12)
      .limit(12)
      .getRawMany();

    const total = result.length > 0 ? parseInt(result[0].total_count) : 0;
    const items = result.map((component) => ({
      ...component,
      id: uuidToShortId(component.id),
      usedUiFrameworks: component.usedUiFrameworks || [],
    }));

    return {
      items,
      total,
    };
  }

  async checkIfCanCreate(user: User) {
    console.log(user);
    return this.limiterService.componentUsage(user);
  }

  async fork(body: { componentId: string }, user: User) {
    const id = shortIdToUuid(body.componentId);

    // Find original component with its theme
    const originalComponent = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.themes', 'themes')
      .where('component.id = :id', { id })
      .getOne();

    if (!originalComponent) {
      throw new NotFoundException(
        `Component with ID "${body.componentId}" not found`,
      );
    }

    // Check if component can be forked (only PUBLIC components)
    if (originalComponent.visibility !== ComponentVisibility.PUBLIC) {
      throw new ForbiddenException('Only public components can be forked');
    }
    await this.limiterService.componentUsage(user);

    const originalCode =
      (
        await this.minioService.getFile('components', originalComponent.id)
      )?.buffer.toString() || '{}';

    // Create new component object
    const newComponent = this.componentRepository.create({
      ...originalComponent,
      id: undefined,
      user: user,
      name: `${originalComponent.name} (Fork)`,
      isShared: false,
      upvotesCount: 0,
      visibility: ComponentVisibility.DRAFT,
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: undefined,
      themes: [],
    });

    // Save new component
    const savedComponent = await this.componentRepository.save(newComponent);

    // If original component had themes, duplicate them
    if (originalComponent?.themes?.length > 0) {
      const newThemes = originalComponent.themes.map((theme) => ({
        ...theme,
        id: undefined,
        component: savedComponent,
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
      }));
      await this.themeRepository.save(newThemes);
    }

    // Save the code file
    const objectName = `${savedComponent.id}`;
    await this.minioService.uploadFile(
      objectName,
      {
        buffer: Buffer.from(originalCode),
        size: originalCode?.length,
        mimetype: 'text/plain',
      },
      'components',
    );

    return {
      ...savedComponent,
      id: uuidToShortId(savedComponent.id),
    };
  }

  async getUserCreateSizeLimit(id) {
    //get user latest subscription plan
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscriptions', 'subscriptions')
      .leftJoinAndSelect('subscriptions.plan', 'plan')
      .where('user.id = :userId', { userId: id })
      .orderBy('subscriptions.createdAt', 'DESC')
      .getOne();
    return user?.subscriptions?.[0]?.plan?.maxComponentSize || 1.5;
  }

  async create(createComponentDto: CreateComponentDto, user: User) {
    const dtoSize = Buffer.from(JSON.stringify(createComponentDto)).length;
    const maxSize = (await this.getUserCreateSizeLimit(user.id)) * 1024 * 1024;
    console.log(maxSize, dtoSize);
    if (dtoSize > maxSize) {
      throw new BadRequestException(
        `Component size exceeds the maximum allowed size`,
      );
    }
    const id = createComponentDto.id;
    const component = {
      ...createComponentDto,
      user,
    };
    if (
      createComponentDto.visibility === ComponentVisibility.PUBLIC &&
      createComponentDto.isShared
    ) {
      this.constructImageService.constructOGImage(
        id,
        createComponentDto.name,
        user.firstName,
        user.lastName,
      );
    }
    if (id) {
      const foundComponent = await this.componentRepository
        .createQueryBuilder('component')
        .leftJoinAndSelect('component.user', 'user')
        .where('component.id = :id and component.user.id = :userId', {
          id: shortIdToUuid(id),
          userId: user.id,
        })
        .getOne();
      if (!foundComponent) {
        throw new ForbiddenException();
      }
      Object.assign(component, { id: shortIdToUuid(id) });
    } else {
      await this.limiterService.componentUsage(user);
    }
    const savedComponent = await this.componentRepository.save(component);
    const objectName = `${savedComponent.id}`;
    await this.minioService.uploadFile(
      objectName,
      {
        buffer: Buffer.from(createComponentDto.code),
        size: createComponentDto.code.length,
        mimetype: 'text/plain',
      },
      'components',
    );

    return {
      ...savedComponent,
      id: uuidToShortId(savedComponent.id),
    };
  }

  async findAllExternal(user: User) {
    const components = await this.externalComponentRepository
      .createQueryBuilder('externalComponent')
      .leftJoinAndSelect('externalComponent.component', 'component')
      .select(['component.id as id', 'component.name as name'])
      .getRawMany();
    return components.map((component) => ({
      id: uuidToShortId(component.id),
      name: component.name,
    }));
  }

  async findAllMy(page: number, term: string, filter: string, user: User) {
    console.log(filter, 'filter', page, term);

    // Create base query
    const q = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.themes', 'themes')
      .where('component.userId = :userId', {
        userId: user.id,
      });

    // Add filters
    if (term) {
      q.andWhere('LOWER(component.name) LIKE LOWER(:term)', {
        term: `%${term}%`,
      });
    }

    if (filter) {
      q.andWhere('component.visibility = :visibility', { visibility: filter });
    }

    // Get total count before pagination
    const total = await q.getCount();

    // Apply pagination
    const components = await q
      .skip(page * 12) // Using skip instead of offset for clarity
      .take(12) // Using take instead of limit for clarity
      .getMany();

    // Transform results
    const items = components.map((component) => ({
      id: uuidToShortId(component.id),
      name: component.name,
      description: component.description,
      language: component.language,
      isShared: component.isShared,
      imageUploaded: component?.imageUploaded,
      theme: component.themes?.[0]?.id
        ? uuidToShortId(component.themes?.[0]?.id)
        : null,
    }));

    return {
      items,
      total,
    };
  }

  async upvote(body: { id: string; status: UpvoteStatus }, user: User) {
    const id = shortIdToUuid(body.id);

    // Find component and check if exists
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .where('component.id = :id', { id })
      .getOne();

    if (!component) {
      throw new NotFoundException(`Component with ID "${body.id}" not found`);
    }

    // Check if user already upvoted/downvoted this component
    const existingUpvote = await this.upvoteRepository
      .createQueryBuilder('upvote')
      .where('upvote.componentId = :componentId AND upvote.userId = :userId', {
        componentId: id,
        userId: user.id,
      })
      .getOne();

    if (existingUpvote) {
      if (existingUpvote.status === body.status) {
        // If same status, remove the vote (toggle off)
        await this.upvoteRepository.remove(existingUpvote);
        if (body.status === UpvoteStatus.UPVOTE) {
          component.upvotesCount--;
        } else {
          component.upvotesCount++;
        }
      } else {
        // If different status, update the vote
        existingUpvote.status = body.status;
        await this.upvoteRepository.save(existingUpvote);
        if (body.status === UpvoteStatus.UPVOTE) {
          component.upvotesCount += 2; // From -1 to +1
        } else {
          component.upvotesCount -= 2; // From +1 to -1
        }
      }
    } else {
      // Create new vote
      const newUpvote = this.upvoteRepository.create({
        status: body.status,
        user,
        component,
      });
      await this.upvoteRepository.save(newUpvote);
      if (body.status === UpvoteStatus.UPVOTE) {
        component.upvotesCount++;
      } else {
        component.upvotesCount--;
      }
    }

    // Save updated component
    await this.componentRepository.save(component);

    return { upvotesCount: component.upvotesCount };
  }

  async updateComponentImageUploaded(id: string) {
    if (id) {
      await this.componentRepository.update(shortIdToUuid(id), { imageUploaded: true });
    }
  }

  async findOne(id: string, user: User) {
    const shortId = shortIdToUuid(id);
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoin('component.upvotes', 'upvotes', 'upvotes.userId = :userId', {
        userId: user.id,
      })
      .leftJoinAndSelect('component.user', 'user')
      .leftJoinAndSelect('component.themes', 'themes')
      .where('component.id = :id', { id: shortId })
      .select([
        'component.id as id',
        'component.name as name',
        'component.description as description',
        'component.language as language',
        'component.isShared as "isShared"',
        'component.pageSettings as "pageSettings"',
        'component.isSetup as "isSetup"',
        'component.usedUiFrameworks as "usedUiFrameworks"',
        'component.usedDeps as "usedDeps"',
        'component.activeFile as "activeFile"',
        'component.previewFile as "previewFile"',
        'component.visibility as "visibility"',
        'json_agg(themes) as "themes"',
        'upvotes.status as "status"',
        'user.id as "userId"',
        'component.upvotesCount as "upvotesCount"',
      ])
      .groupBy('component.id')
      .addGroupBy('themes.id')
      .addGroupBy('upvotes.status')
      .addGroupBy('user.id')
      .getRawOne();

    console.log(component,user.id); 
    if (!component) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }
    const isOwner = component.userId === user.id;
    if (!isOwner) {
      if (component.visibility === ComponentVisibility.PRIVATE || component.visibility === ComponentVisibility.DRAFT) {
        throw new ForbiddenException();
      }
      if (component.visibility !== ComponentVisibility.EXTERNAL) {
        const isUsed = await this.limiterService.checkIfComponentUsed(
          user,
          component.id,
        );
        if (!isUsed) {
          await this.limiterService.creditUsage(user, component.id);
        }
      }
    }
    const f =
      (
        await this.minioService.getFile('components', `${component.id}`)
      )?.buffer.toString() || '{}';

    console.log(component);
    let result = {
      id: uuidToShortId(component?.id),
      name: component?.name,
      description: component?.description,
      language: component?.language,
      activeFile: component?.activeFile,
      previewFile: component?.previewFile,
      files: JSON.parse(f),
      pageSettings: component?.pageSettings,
      isShared: component?.isShared,
      upvotesCount: component?.upvotesCount,
      status: component?.status,
      isSetup: component?.isSetup,
      usedUiFrameworks: component?.usedUiFrameworks,
      usedDeps: component?.usedDeps,
      visibility: component?.visibility,
      theme: null,
      isOwner,
    };

    if (component?.themes?.[0]?.id) {
      result.theme = {
        id: uuidToShortId(component?.themes?.[0]?.id),
        factors: component?.themes?.[0]?.factors,
        groups: component?.themes?.[0]?.groups,
        values: component?.themes?.[0]?.values,
      };
    }
    return result;
  }

  async update(id: string, updateComponentDto: any, user: User) {
    const component = await this.findOne(id, user);
    Object.assign(component, updateComponentDto);
    return await this.componentRepository.save(component);
  }

  async remove(id: string, user: User) {
    await this.checkIfUserIsOwnerOrThrow403(id, user);
    const shortId = shortIdToUuid(id);
    await this.themeRepository.delete({ component: { id: shortId } });
    const result = await this.componentRepository.delete({ id: shortId, user });
    this.minioService.deleteFile('components', shortId);
    this.minioService.deleteFile('images', id);
    this.minioService.deleteFile('images', id + '-og');
    if (result.affected === 0) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }
  }
}
