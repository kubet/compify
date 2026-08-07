import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './modules/ai/ai.controller';
import { AiService } from './modules/ai/ai.service';
import { UserModule } from './modules/user/user.module';
import { ComponentController } from './modules/compontent/component.controller';
import { ComponentService } from './modules/compontent/component.service';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => databaseOptions(configService),
    }),
    UserModule,
    ComponentModule,
    MinioModule,
    AiModule,
    ThemeModule,
    CliModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
