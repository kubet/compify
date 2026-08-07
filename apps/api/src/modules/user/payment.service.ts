import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionStatus } from 'src/entities/subscription/subscription.entity';
import {
  BillingCycle,
  SubscriptionPlan,
} from 'src/entities/subscription/subscription-plan.entity';
import { Subscription } from 'src/entities/subscription/subscription.entity';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  private readonly stripeClient?: Stripe;
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) this.stripeClient = new Stripe(secretKey);
  }

  private get stripe(): Stripe {
    if (!this.stripeClient) {
      throw new ServiceUnavailableException('Stripe billing is not configured');
    }
    return this.stripeClient;
  }

  private get stripeWebhookSecret(): string {
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException(
        'Stripe webhook verification is not configured',
      );
    }
    return secret;
  }

  async createFreeSubscription(user: User) {
    await this.subscriptionRepo.update(
      { user: { id: user.id } },
      { status: SubscriptionStatus.EXPIRED },
    );
    await this.subscriptionRepo.save({
      user: { id: user.id },
      plan: { id: process.env.FREE_PLAN_ID },
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      lastResetDate: new Date(),
      endDate: null,
    });

    const plan = await this.subscriptionPlanRepo.findOneBy({
      id: process.env.FREE_PLAN_ID,
    });

    const planCredits = plan.fromCredits || 0;
    const planAiCredits = plan.toAiCredits || 0;
    const planFreeAiCredits = plan.toFreeAiCredits || 0;
    await this.userRepo.update(user.id, {
      availableCredits: planCredits,
      availableAiCredits: planAiCredits,
      availableFreeAiCredits: planFreeAiCredits,
    });
  }

  async cancelSubscription(user: User) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { user: { id: user.id }, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    await this.subscriptionRepo.update(subscription.id, {
      status: SubscriptionStatus.CANCELLED,
    });

    // await this.createFreeSubscription(user);

    return { message: 'Subscription cancelled successfully' };
  }
  async previewUpgrade(newPlanId: string, user: User) {
    const currentSubscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId: user.id })
      .orderBy('subscription.createdAt', 'DESC')
      .getOne();

    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlan = await this.subscriptionPlanRepo.findOneBy({
      id: newPlanId,
    });
    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId,
    );

    // Preview the invoice with the same parameters we'll use for the actual upgrade
    const invoice = await this.stripe.invoices.retrieveUpcoming({
      // customer: stripeSubscription.customer, // Add customer ID
      subscription: currentSubscription.stripeSubscriptionId,
      subscription_items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPlan.stripePriceId,
        },
      ],
      subscription_proration_date: Math.floor(Date.now() / 1000), // Add proration date
      subscription_billing_cycle_anchor: 'now', // Add billing cycle anchor
      subscription_proration_behavior: 'create_prorations', // Add proration behavior
    });

    return {
      amountDue: invoice.amount_due / 100,
      prorationDate: invoice.period_start,
      nextBillingDate: invoice.period_end,
    };
  }
  async performUpgrade(newPlanId: string, user: User) {
    const currentSubscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.userId = :userId', { userId: user.id })
      .orderBy('subscription.createdAt', 'DESC')
      .getOne();

    if (!currentSubscription) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlan = await this.subscriptionPlanRepo.findOneBy({
      id: newPlanId,
    });
    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    // Get the subscription from Stripe
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId,
    );

    // Check subscription status
    if (stripeSubscription.status === 'incomplete_expired') {
      throw new Error(
        'Cannot update expired subscription. Please create a new subscription.',
      );
    }

    if (stripeSubscription.status !== 'active') {
      throw new Error(
        `Cannot update subscription in ${stripeSubscription.status} state`,
      );
    }

    try {
      // Perform the update
      const updatedSubscription = await this.stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations',
          billing_cycle_anchor: 'now',
        },
      );

      // Update database
      await this.subscriptionRepo.update(
        { id: currentSubscription.id },
        {
          plan: { id: newPlanId },
        },
      );

      return { success: true, subscription: updatedSubscription };
    } catch (error) {
      // Log the error details
      console.error('Stripe subscription update failed:', error);

      if (error.type === 'StripeInvalidRequestError') {
        throw new Error(`Unable to update subscription: ${error.message}`);
      }

      throw error;
    }
  }

  async checkFailedPayments(user: User) {
    const failedPayments = user.failedPayments || 0;
    if (failedPayments > 4) {
      throw new Error('Failed payments limit reached');
    }
  }

  async createCheckoutSession(body: any, user: User, req: Request) {
    await this.checkFailedPayments(user);
    const plan = await this.subscriptionPlanRepo.findOneBy({
      id: body?.planId,
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const clientIp = this.getClientIp(req);
    const session = await this.stripe.checkout.sessions.create({
      customer_email: user?.email,
      allow_promotion_codes: body?.planId === "f6865225-6db0-447e-9076-cec6f35347a0" ? true : false,
      metadata: {
        userId: user?.id,
        planId: body?.planId,
        clientIp: clientIp,
      },
      line_items: [
        {
          price: plan?.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/payment?success=false`,
    });

    return { url: session.url };
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      '127.0.0.1'
    );
  }

  async stripeWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;
    // Resolve optional configuration before signature parsing so disabled billing
    // produces an explicit 503 rather than a misleading verification error.
    const stripe = this.stripe;
    const webhookSecret = this.stripeWebhookSecret;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;

          const userId = session.metadata?.userId;
          const planId = session.metadata?.planId;

          if (!userId || !planId) {
            throw new Error('Missing required metadata');
          }

          const [user, plan] = await Promise.all([
            this.userRepo.findOneBy({ id: userId }),
            this.subscriptionPlanRepo.findOneBy({ id: planId }),
          ]);

          if (!user || !plan) {
            throw new Error('User or plan not found');
          }

          const startDate = new Date();
          const endDate = new Date(startDate);

          if (plan.billingCycle === BillingCycle.MONTHLY) {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (plan.billingCycle === BillingCycle.ANNUALLY) {
            endDate.setFullYear(endDate.getFullYear() + 1);
          }

          await this.subscriptionRepo.save({
            user: { id: userId },
            plan: { id: planId },
            status: SubscriptionStatus.ACTIVE,
            stripeSubscriptionId: session.subscription as string,
            ipAddress: session.metadata?.clientIp,
            startDate,
            endDate,
            lastResetDate: new Date(),
          });
          const planCredits = plan.fromCredits || 0;
          const planAiCredits = plan.toAiCredits || 0;
          await this.userRepo.update(user.id, {
            availableCredits: planCredits,
            availableAiCredits: planAiCredits,
          });
              break;
        }

        case 'customer.subscription.deleted': {
          const deletedSubscription = event.data.object as Stripe.Subscription;

          const subscription = await this.subscriptionRepo.findOne({
            where: { stripeSubscriptionId: deletedSubscription.id },
          });

          if (subscription) {
            await this.subscriptionRepo.update(
              { stripeSubscriptionId: deletedSubscription.id },
              { status: SubscriptionStatus.CANCELLED },
            );
                }
          break;
        }

        case 'customer.subscription.updated': {
          const updatedSubscription = event.data.object as Stripe.Subscription;
          if (updatedSubscription.metadata?.isUpgrade === 'true') {
            const subscription = await this.subscriptionRepo.findOne({
              where: { stripeSubscriptionId: updatedSubscription.id },
              relations: ['user'],
            });

            if (subscription) {
              // Calculate new end date based on annual billing
              const startDate = new Date();
              const endDate = new Date(startDate);
              endDate.setFullYear(endDate.getFullYear() + 1);

              // Update the subscription in your database
              await this.subscriptionRepo.update(
                { id: subscription.id },
                {
                  plan: { id: updatedSubscription.metadata.newPlanId },
                  startDate,
                  endDate,
                  lastResetDate: new Date(),
                },
              );
              const plan = await this.subscriptionPlanRepo.findOneBy({
                id: updatedSubscription.metadata.newPlanId,
              });
              const planCredits = plan.fromCredits || 0;
              const planAiCredits = plan.toAiCredits || 0;
              await this.userRepo.update(subscription.user.id, {
                availableCredits: planCredits,
                availableAiCredits: planAiCredits,
              });

                    }
          }
          // Check if subscription has expired or is past due
          else if (
            ['expired', 'unpaid', 'past_due'].includes(
              updatedSubscription.status,
            )
          ) {
            const subscription = await this.subscriptionRepo.findOne({
              where: { stripeSubscriptionId: updatedSubscription.id },
              relations: ['user'],
            });

            if (subscription) {
              await this.subscriptionRepo.update(
                { stripeSubscriptionId: updatedSubscription.id },
                { status: SubscriptionStatus.EXPIRED },
              );

              // Create free subscription for the user
              await this.createFreeSubscription(subscription.user);
            }
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const user = await this.userRepo.findOne({
            where: { email: invoice.customer_email }
          });
          
          if (user) {
            user.failedPayments = (user.failedPayments || 0) + 1;
            await this.userRepo.save(user);
          }
          break;
        }

        default:
        //   console.log(`Unhandled event type: ${event.type}`);
      }

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }
}
