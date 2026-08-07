import { Global, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user/user.entity';
import { Token } from 'src/entities/user/token.entity';
import { JwtStrategy } from 'src/common/jwt.strategy';
import { SubscriptionPlan } from 'src/entities/subscription/subscription-plan.entity';
import { Subscription } from 'src/entities/subscription/subscription.entity';
import { SubscriptionController } from './subscription.controller';
import { Component } from 'src/entities/project/component.entity';
import { EmailService } from '../email/email.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from 'src/common/google.strategy';
import { NewsletterController } from './newsletter.controller';
import { Newsletter } from 'src/entities/newsletter/newsletter.entity';
import { MinioModule } from '../minio/minio.module';
import { PaymentService } from './payment.service';
import { ScheduleModule } from '@nestjs/schedule';
import { UsageResetService } from './usage-reset.service';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { UserUsedComponents } from 'src/entities/user/user-used-components.entity';
import { Upvote } from 'src/entities/project/upvote.entity';
import { Theme } from 'src/entities/project/theme.entity';
import { Report } from 'src/entities/common/report.entity';
import { GoogleOAuthGuard } from 'src/common/guards/google-oauth.guard';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    MinioModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      Token,
      Subscription,
      SubscriptionPlan,
      Component,
      Newsletter,
      Component,
      CliToken,
      Theme,
      Upvote,
      Report,
      UserUsedComponents,
    ]),
  ],
  providers: [
    UserService,
    JwtService,
    JwtStrategy,
    EmailService,
    GoogleStrategy,
    GoogleOAuthGuard,
    PaymentService,
    UsageResetService,
  ],
  controllers: [
    UserController,
    SubscriptionController,
    AuthController,
    NewsletterController,
  ],
  exports: [JwtStrategy, PassportModule, GoogleStrategy],
})
export class UserModule {}
