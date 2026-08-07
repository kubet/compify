import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Component } from './component.entity';

@Entity('themes')
export class Theme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  factors: any;

  @Column({ type: 'jsonb' })
  groups: any;

  @Column({ type: 'jsonb' })
  values: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Component, (component) => component.themes)
  component: Component;
}
