import { Module } from '@nestjs/common';
import { CliController } from './cli.controller';
import { CliService } from './cli.service';
import { MinioModule } from '../minio/minio.module';
import { Component } from 'src/entities/project/component.entity';
import { User } from 'src/entities/user/user.entity';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { ComponentRevision } from 'src/entities/project/component-revision.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentModule } from '../compontent/component.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Component, ComponentRevision, User, CliToken]),
    MinioModule,
    ComponentModule,
    ConfigModule,
  ],
  controllers: [CliController],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}
