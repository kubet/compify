import { Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, Entity, OneToOne, JoinColumn } from "typeorm";
import { User } from "../user/user.entity";

@Entity()
export class CliToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.cliToken)
  @JoinColumn()
  user: User;

  @Column()
  token: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  lastUsedAt: Date;
}