import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Component } from 'src/entities/project/component.entity';
import { ComponentService } from './component.service';
import { ComponentController } from './component.controller';
import { MinioModule } from '../minio/minio.module';
import { ConstructImageService } from './construct-image.service';
import { PublicComponentController } from './public-component.controller';
import { RegistryController } from './registry.controller';
import { LimiterService } from '../limiter/limiter.service';
import { User } from 'src/entities/user/user.entity';
import { Theme } from 'src/entities/project/theme.entity';
import { ExternalComponent } from 'src/entities/project/externalComponent.entity';
import { Report } from 'src/entities/common/report.entity';
import { UserUsedComponents } from 'src/entities/user/user-used-components.entity';
import { Upvote } from 'src/entities/project/upvote.entity';
import { Subscription } from 'src/entities/subscription/subscription.entity';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Component,
      User,
      Theme,
      ExternalComponent,
      Report,
      UserUsedComponents,
      Upvote,
      Subscription,
    ]),
    MinioModule,
  ],
  controllers: [
    ComponentController,
    PublicComponentController,
    RegistryController,
  ],
  providers: [ComponentService, ConstructImageService, LimiterService],
  exports: [ComponentService],
})
export class ComponentModule {}
