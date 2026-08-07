import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { ComponentModule } from './modules/compontent/component.module';
import { MinioModule } from './modules/minio/minio.module';
import { AiModule } from './modules/ai/ai.module';
import { ThemeModule } from './modules/theme/theme.module';
import { CliModule } from './modules/cli/cli.module';
import { databaseOptions, validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.STAGE
        ? [`.env.stage.${process.env.STAGE}`, '.env']
        : ['.env'],
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseOptions(configService),
    }),
    UserModule,
    ComponentModule,
    MinioModule,
    AiModule,
    ThemeModule,
    CliModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
