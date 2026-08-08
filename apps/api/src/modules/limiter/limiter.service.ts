import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Component } from 'src/entities/project/component.entity';
import { Subscription } from 'src/entities/subscription/subscription.entity';
import { UserUsedComponents } from 'src/entities/user/user-used-components.entity';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';

export interface AiCreditReservation {
  userId: string;
  credits: number;
  kind: 'paid' | 'free';
  active: boolean;
}

@Injectable()
export class LimiterService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UserUsedComponents)
    private userUsedComponentsRepository: Repository<UserUsedComponents>,
  ) {}

  async awardUserCredit(componentId: string) {
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.user', 'user')
      .where('component.id = :componentId', { componentId })
      .getOne();

    if (component?.user?.id) {
      const subscription = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .where('subscription.userId = :userId', { userId: component.user.id })
        .orderBy('subscription.createdAt', 'DESC')
        .getOne();

      // Only award credit if it won't exceed the plan's toCredits limit
      if (subscription?.plan?.toCredits > component?.user?.availableCredits) {
        await this.userRepository.update(component?.user?.id, {
          availableCredits: component?.user?.availableCredits + 1,
        });
      }
    }
  }

  async creditUsage(user: User, componentId: string) {
    const subscription = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('subscription.createdAt', 'DESC')
      .limit(1)
      .select(['plan.fromCredits', 'plan.toCredits', 'plan.toAiCredits'])
      .getRawOne();
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    if (user.availableCredits <= 0) {
      throw new HttpException(
        "You're out of use credits — they refill monthly, and you earn more when others use your components.",
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const userUsedComponents = await this.userUsedComponentsRepository
      .createQueryBuilder('userUsedComponents')
      .leftJoinAndSelect('userUsedComponents.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();
    const currentTime = new Date();
    const expirationPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const filteredComponents = userUsedComponents?.components?.filter(
      (comp) => {
        const usedDate = new Date(comp.date);
        return currentTime.getTime() - usedDate.getTime() < expirationPeriod;
      },
    );
    const newComponent = { id: componentId, date: new Date() };
    if (userUsedComponents?.id) {
      await this.userUsedComponentsRepository.update(userUsedComponents.id, {
        components: [...filteredComponents, newComponent],
      });
    } else {
      await this.userUsedComponentsRepository.save({
        user: { id: user.id },
        components: [newComponent],
      });
    }
    this.userRepository.update(user.id, {
      availableCredits: user.availableCredits - 1,
    });
    this.awardUserCredit(componentId);
    return null;
  }

  // Check if user has used this component before
  async checkIfComponentUsed(user: User, componentId: string) {
    const userUsedComponents = await this.userUsedComponentsRepository
      .createQueryBuilder('userUsedComponents')
      .leftJoinAndSelect('userUsedComponents.user', 'user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();
    const currentTime = new Date();
    const expirationPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const filteredComponents = userUsedComponents?.components?.filter(
      (comp) => {
        const usedDate = new Date(comp.date);
        return currentTime.getTime() - usedDate.getTime() < expirationPeriod;
      },
    );

    if (userUsedComponents) {
      const component = userUsedComponents.components.find(
        (comp) => comp.id === componentId,
      );
      if (component) {
        const usedDate = new Date(component.date);
        if (currentTime.getTime() - usedDate.getTime() < expirationPeriod) {
          await this.userUsedComponentsRepository.update(
            userUsedComponents.id,
            {
              components: filteredComponents,
            },
          );
          return true;
        }
      }
    }
    return false;
  }

  async reserveAiCredits(
    userId: string,
    credits: number = 1,
    kind: 'paid' | 'free' = 'paid',
  ): Promise<AiCreditReservation> {
    if (!Number.isSafeInteger(credits) || credits < 1 || credits > 10_000) {
      throw new HttpException('Invalid credit request', HttpStatus.BAD_REQUEST);
    }
    const subscription = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.subscriptions', 'subscription')
      .where('user.id = :userId', { userId })
      .select('subscription.id', 'subscriptionId')
      .limit(1)
      .getRawOne();
    if (!subscription?.subscriptionId)
      throw new NotFoundException('Subscription not found');

    const column =
      kind === 'paid' ? 'availableAiCredits' : 'availableFreeAiCredits';
    const result = await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ [column]: () => `"${column}" - ${credits}` })
      .where('id = :userId', { userId })
      .andWhere(`"${column}" >= :credits`, { credits })
      .execute();
    if (result.affected !== 1) {
      throw new HttpException(
        kind === 'paid'
          ? "You don't have enough ai credits!"
          : "You don't have enough free ai credits!",
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return { userId, credits, kind, active: true };
  }

  async settleAiCreditReservation(
    reservation: AiCreditReservation,
    usedCredits: number = reservation.credits,
  ) {
    if (!reservation.active) return false;
    if (
      !Number.isSafeInteger(usedCredits) ||
      usedCredits < 1 ||
      usedCredits > reservation.credits
    ) {
      throw new HttpException(
        'Invalid credit settlement',
        HttpStatus.BAD_REQUEST,
      );
    }
    const refundCredits = reservation.credits - usedCredits;
    reservation.active = false;
    if (refundCredits === 0) return true;
    const column =
      reservation.kind === 'paid'
        ? 'availableAiCredits'
        : 'availableFreeAiCredits';
    try {
      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ [column]: () => `"${column}" + ${refundCredits}` })
        .where('id = :userId', { userId: reservation.userId })
        .andWhere(`"${column}" <= :maxBeforeRefund`, {
          maxBeforeRefund: 2_147_483_647 - refundCredits,
        })
        .execute();
      if (result.affected !== 1) throw new Error('AI credit settlement failed');
      return true;
    } catch (error) {
      reservation.active = true;
      throw error;
    }
  }

  async refundAiCreditReservation(reservation: AiCreditReservation) {
    if (!reservation.active) return false;
    // Claim the refund before awaiting so repeated error paths cannot refund twice.
    reservation.active = false;
    const column =
      reservation.kind === 'paid'
        ? 'availableAiCredits'
        : 'availableFreeAiCredits';
    try {
      const result = await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ [column]: () => `"${column}" + ${reservation.credits}` })
        .where('id = :userId', { userId: reservation.userId })
        .andWhere(`"${column}" <= :maxBeforeRefund`, {
          maxBeforeRefund: 2_147_483_647 - reservation.credits,
        })
        .execute();
      if (result.affected !== 1) throw new Error('AI credit refund failed');
      return true;
    } catch (error) {
      reservation.active = true;
      throw error;
    }
  }

  async aiCreditUsage(user: User, credits: number = 1) {
    await this.reserveAiCredits(user.id, credits, 'paid');
    return null;
  }

  async freeAiCreditUsage(user: User, credits: number = 1) {
    await this.reserveAiCredits(user.id, credits, 'free');
    return null;
  }

  async componentUsage(user: User) {
    const subscription = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('user.id = :userId', { userId: user.id })
      .orderBy('subscription.createdAt', 'DESC')
      .limit(1)
      .select(['plan.maxComponents'])
      .getRawOne();
    const components = await this.componentRepository.count({
      where: { user: { id: user.id } },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    if (components >= (subscription.plan_maxComponents || 0)) {
      throw new HttpException(
        'You have reached the maximum number of components',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return null;
  }
}
