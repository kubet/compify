import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  VersionColumn,
  Check,
  Unique,
} from 'typeorm';
import { Component } from './component.entity';

@Entity('themes')
@Unique('UQ_themes_component', ['componentId'])
@Check('CHK_themes_version', '"version" >= 1')
@Check('CHK_themes_groups_object', `jsonb_typeof("groups") = 'object'`)
@Check('CHK_themes_factors_array', `jsonb_typeof("factors") = 'array'`)
@Check('CHK_themes_values_array', `jsonb_typeof("values") = 'array'`)
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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn({ default: 1 })
  version: number;

  @Column({ type: 'uuid' })
  componentId: string;

  @ManyToOne(() => Component, (component) => component.themes, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'componentId' })
  component: Component;
}
