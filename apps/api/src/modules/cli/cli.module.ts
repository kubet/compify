import { Module } from '@nestjs/common';
import { CliController } from './cli.controller';
import { CliService } from './cli.service';
import { MinioModule } from '../minio/minio.module';
import { Component } from 'src/entities/project/component.entity';
import { User } from 'src/entities/user/user.entity';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Component,
            User,
            CliToken,
          ]),
          MinioModule,
    ],
  controllers: [CliController],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}
