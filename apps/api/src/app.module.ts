import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './modules/ai/ai.controller';
import { AiService } from './modules/ai/ai.service';
import { UserModule } from './modules/user/user.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ComponentController } from './modules/compontent/component.controller';
import { ComponentService } from './modules/compontent/component.service';
import { ComponentModule } from './modules/compontent/component.module';
import { MinioModule } from './modules/minio/minio.module';
import { AiModule } from './modules/ai/ai.module';
import { ThemeModule } from './modules/theme/theme.module';
import { CliModule } from './modules/cli/cli.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: true,
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        migrations: ['dist/migrations/*.js'],
      }),
    }),
    UserModule,
    MailerModule,
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
