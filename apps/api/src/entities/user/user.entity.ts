import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Subscription } from '../subscription/subscription.entity';
import { Component } from '../project/component.entity';
import { Upvote } from '../project/upvote.entity';
import { CliToken } from '../cli/cli-tokens.entity';


@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({nullable:true})
  firstName: string;

  @Column({nullable:true})
  lastName: string;

  @Column({ default: false })
  valid: boolean;

  @Column({ type: 'integer', default: 0 })
  availableCredits: number;

  @Column({ type: 'integer', default: 0 })
  availableAiCredits: number;

  @Column({ type: 'integer', default: 0 })
  availableFreeAiCredits: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions: Subscription[];

  @OneToMany(() => Component, (component) => component.user)
  components: Component[];

  @OneToMany(() => Upvote, (upvote) => upvote.user)
  upvotes: Upvote[];

  @OneToOne(() => CliToken, (cliToken) => cliToken.user)
  cliToken: CliToken;

  @Column({ default: 0, nullable: true })
  failedPayments: number;

  @Column({ type: 'jsonb', nullable: true })
  languagePreferences: any;

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
