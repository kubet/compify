import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { MinioClientService } from './modules/minio/minio.service';

@Injectable()
export class AppService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly minio: MinioClientService,
  ) {}

  async checkReadiness(): Promise<void> {
    await this.manager.query('SELECT 1');
    await this.minio.checkRequiredBuckets();
  }
}
