import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
export enum TokenType {
  RESET_PASSWORD,
  EMAIL_VERIFICATION,
  CHANGE_EMAIL,
}

@Entity()
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  token: string;

  @Column({ nullable: true })
  meta: string;

  @CreateDateColumn({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;
}
