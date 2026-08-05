import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LimiterService } from '../limiter/limiter.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user/user.entity';
import { Component } from 'src/entities/project/component.entity';
import { UserUsedComponents } from 'src/entities/user/user-used-components.entity';
import { Subscription } from 'src/entities/subscription/subscription.entity';
import { SubscriptionThrottlerGuard } from 'src/common/guards/subscription-throttler.guard';
import { JwtService } from '@nestjs/jwt';
import { ProviderService } from './provider.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Component,
      UserUsedComponents,
      Subscription,
    ]),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    LimiterService,
    SubscriptionThrottlerGuard,
    JwtService,
    ProviderService,
  ],
  exports: [AiService, LimiterService, ProviderService],
})
export class AiModule {}
