import { Column, Entity, ManyToOne } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Component } from './component.entity';

export enum UpvoteStatus {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

@Entity()
export class Upvote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UpvoteStatus, default: null, nullable: true })
  status: UpvoteStatus | null;

  @ManyToOne(() => User, (user) => user.upvotes)
  user: User;

  @ManyToOne(() => Component, (component) => component.upvotes)
  component: Component;
}
