import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioClientService } from './minio.service';

@Module({
  imports: [ConfigModule],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioModule {}
