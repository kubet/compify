import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription/subscription.entity';
import { User } from 'src/entities/user/user.entity';
import { SubscriptionDateCalculator } from 'src/common/subscription-date-calculator';
import { addMonths, endOfDay, subMonths } from 'date-fns';

@Injectable()
export class UsageResetService {
  private readonly logger = new Logger(UsageResetService.name);
  private readonly dateCalculator = new SubscriptionDateCalculator();
  // private todayTest = new Date(2025, 1, 8, 23, 59, 59);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  //   @Cron(CronExpression.EVERY_MINUTE)
  @Cron('1 0,12 * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleDailyResets() {
    this.logger.log('Starting daily usage reset check');

    try {
      const today = new Date();
      // const today = this.todayTest;
      const tomorrow = endOfDay(today);

      const oneMonthAgo = endOfDay(subMonths(today, 1));
      await this.handleSubscriptionExpiration();

      //   console.log(oneMonthAgo);
      const subscriptionsToProcess = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .where('subscription.status IN (:...statuses)', {
          statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
        })
        .andWhere(
          `(
          (subscription.lastResetDate IS NULL AND 
           subscription.startDate <= :tomorrow)
          OR
          (subscription.lastResetDate IS NOT NULL AND 
           subscription.lastResetDate <= :oneMonthAgo)
        )`,
          { tomorrow, oneMonthAgo },
        )
        .getMany();
      //   console.log(subscriptionsToProcess.length);
      if (subscriptionsToProcess.length === 0) {
        this.logger.log('No subscriptions need resetting today');
        return;
      }

      // Process in batches to avoid memory issues
      const BATCH_SIZE = 100;
      for (let i = 0; i < subscriptionsToProcess.length; i += BATCH_SIZE) {
        const batch = subscriptionsToProcess.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((subscription) =>
            this.processSubscriptionReset(subscription, today),
          ),
        );
      }
    } catch (error) {
      this.logger.error('Failed to process daily resets', error.stack);
      throw error;
    }
  }

  private async processSubscriptionReset(
    subscription: Subscription,
    today: Date,
  ) {
    try {
      const shouldReset = this.dateCalculator.shouldResetUsage(
        subscription.startDate,
        today,
        subscription.lastResetDate,
      );
      //   console.log(shouldReset, {
      //     startDate: subscription.startDate,
      //     lastResetDate: subscription.lastResetDate,
      //     today,
      //   });
      if (!shouldReset) return;

      await this.resetUsage(subscription);
    } catch (error) {
      this.logger.error(
        `Failed to process reset for subscription ${subscription.id}`,
        error.stack,
      );
      // Consider adding retry logic or alert mechanism here
    }
  }

  private async resetUsage(subscription: Subscription) {
    this.logger.log(`Resetting usage for subscription ${subscription.id}`);

    // Normalize reset date to midnight
    const resetDate = new Date();
    // const resetDate = this.todayTest;
    resetDate.setHours(12, 0, 0, 0);
    const nextEndDate = addMonths(resetDate, 1);

    await this.subscriptionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const updateResult = await transactionalEntityManager
          .createQueryBuilder()
          .update(Subscription)
          .set({ lastResetDate: resetDate, endDate: nextEndDate })
          .where('id = :id', { id: subscription.id })
          .andWhere('status IN (:...statuses)', {
            statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
          })
          .execute();
        if (updateResult.affected === 0) {
          throw new Error(
            `Subscription ${subscription.id} was modified during reset`,
          );
        }

        // Reset user's usage counters
        if (subscription.user) {
          const planCredits = subscription.plan.fromCredits || 0;
          const planAiCredits = subscription.plan.toAiCredits || 0;
          const planFreeAiCredits = subscription.plan.toFreeAiCredits || 0;
          const userUpdateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(User)
            .set({
              availableCredits: planCredits,
              availableAiCredits: planAiCredits,
              availableFreeAiCredits: planFreeAiCredits,
            })
            .where('id = :id', { id: subscription.user.id })
            .execute();

          if (userUpdateResult.affected === 0) {
            throw new Error(
              `User ${subscription.user.id} update failed during reset`,
            );
          }
        }
      },
    );

    this.logger.log(
      `Successfully reset usage for subscription ${subscription.id}`,
    );
  }

  private async handleSubscriptionExpiration() {
    this.logger.log('Checking for expired subscriptions');

    const today = new Date();
    // const today = this.todayTest;
    const checkDate = endOfDay(today);
    // console.log(checkDate);
    try {
      const expiredSubscriptions = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .where('subscription.status = :cancelledStatus', {
          cancelledStatus: SubscriptionStatus.CANCELLED,
        })
        .andWhere('subscription.endDate <= :checkDate', { checkDate })
        .getMany();

      if (expiredSubscriptions.length === 0) {
        this.logger.log('No subscriptions need to be expired');
        return;
      }

      // Process in batches similar to reset logic
      const BATCH_SIZE = 100;
      for (let i = 0; i < expiredSubscriptions.length; i += BATCH_SIZE) {
        const batch = expiredSubscriptions.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((subscription) => this.processExpiration(subscription)),
        );
      }

      this.logger.log(
        `Processed ${expiredSubscriptions.length} expired subscriptions`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process subscription expirations',
        error.stack,
      );
      throw error;
    }
  }

  private async processExpiration(subscription: Subscription) {
    try {
      await this.subscriptionRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Subscription)
            .set({
              status: SubscriptionStatus.EXPIRED,
            })
            .where('id = :id', { id: subscription.id })
            .andWhere('status = :status', {
              status: SubscriptionStatus.CANCELLED,
            })
            .execute();

          if (updateResult.affected === 0) {
            throw new Error(
              `Subscription ${subscription.id} was modified during expiration process`,
            );
          }
        },
      );

      this.logger.log(`Successfully expired subscription ${subscription.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process expiration for subscription ${subscription.id}`,
        error.stack,
      );
      // Consider adding retry logic or alert mechanism here
    }
  }
}
