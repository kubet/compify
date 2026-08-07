import { Column, CreateDateColumn, Entity, ManyToOne } from 'typeorm';
import { PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum ReportItemType {
  COMPONENT = 'component',
}

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  itemId: string;

  @Column({ nullable: true })
  itemType: ReportItemType;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
