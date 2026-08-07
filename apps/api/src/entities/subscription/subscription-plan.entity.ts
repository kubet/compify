import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

export enum BillingCycle {
  MONTHLY = 'monthly',
  ANNUALLY = 'annually',
}

@Entity()
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  bestFor: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'integer', default: 0 })
  level: number;

  @Column('text', { array: true, nullable: true })
  colors: string[];

  @Column({ type: 'integer', default: 0 })
  fromCredits: number;

  @Column({ type: 'integer', default: 0 })
  toCredits: number;

  @Column({ type: 'integer', default: 0 })
  toAiCredits: number;

  @Column({ type: 'integer', default: 0 })
  toFreeAiCredits: number;
  @Column({ type: 'integer', default: 0 })
  maxComponents: number;

  @Column({ type: 'integer', default: 0 })
  maxComponentSize: number;

  @Column({ type: 'text', nullable: true })
  stripePriceId: string;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    nullable: true,
  })
  billingCycle: BillingCycle;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  promoData: any;

  @Column({ type: 'text', array: true, nullable: true })
  features: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
