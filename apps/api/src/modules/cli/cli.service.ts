import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component, ComponentVisibility } from 'src/entities/project/component.entity';
import { User } from 'src/entities/user/user.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { shortIdToUuid, uuidToShortId } from 'src/common/short-id';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { MinioClientService } from '../minio/minio.service';

@Injectable()
export class CliService {
  constructor(
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectRepository(CliToken)
    private readonly cliTokenRepo: Repository<CliToken>,
    private readonly minioService: MinioClientService,    
  ) {}

  async getUserByCliToken(cliToken: string) {
    const cliTokenEntity = await this.cliTokenRepo.createQueryBuilder('cliToken')
    .leftJoinAndSelect('cliToken.user', 'user')
    .where('cliToken.token = :token', { token: cliToken })
    .getOne();
    if (!cliTokenEntity) {
      throw new UnauthorizedException('Invalid CLI token');
    }
    return cliTokenEntity.user;
  }

  async getAll(cliToken: string) {
    const user = await this.getUserByCliToken(cliToken);
    const components = await this.componentRepository.createQueryBuilder('component')
    .leftJoinAndSelect('component.user', 'user')
    .where('component.user.id = :userId', { userId: user.id })
    .select(['component.id as id', 'component.name as name', 'component.language as language', 'component.usedUiFrameworks as "usedUiFrameworks"'])
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
      q.where('component.publishingDomain = :publishingDomain', { publishingDomain: id.substring(1) });
    } else {
      q.where('component.id = :id', { id: shortIdToUuid(id) });
    }
    const component = await q.getOne();

    if (!component) {
      throw new NotFoundException(`Component with ID "${id}" not found`);
    }

    const isOwner = component.user.id === user.id;
    if (!isOwner && (component.visibility === ComponentVisibility.PRIVATE || component.visibility === ComponentVisibility.DRAFT)) {
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
      Object.entries(files).map(([filename, content]) => [
        filename,
        content?.code || ''
      ])
    );

    return {
      id: uuidToShortId(component?.id),
      name: component?.name,
      language: component?.language,
      usedUiFrameworks: component?.usedUiFrameworks,
      files: remappedFiles,
    }
  }
}
