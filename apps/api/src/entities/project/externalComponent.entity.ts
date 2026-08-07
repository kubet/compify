import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';
import { Component } from './component.entity';

@Entity()
export class ExternalComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Component)
  @JoinColumn()
  component: Component;
}
