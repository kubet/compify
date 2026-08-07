import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Theme } from './theme.entity';
import { Upvote } from './upvote.entity';

export enum RuntimeLanguage {
  REACT = 'react',
  REACT_TS = 'react-ts',
  VUE = 'vue',
  VUE_TS = 'vue-ts',
  NEXT_JS = 'nextjs',
  NEXT_TS = 'nextjs-ts',
  REACT_NATIVE = 'react-native',
  REACT_NATIVE_TS = 'react-native-ts',
  STATIC = 'static',
}

export enum ComponentVisibility {
  DRAFT = 'draft',
  PRIVATE = 'private',
  PUBLIC = 'public',
  EXTERNAL = 'external',
  FREE = 'free',
}

@Entity()
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  activeFile: string;

  @Column({ nullable: true })
  previewFile: string;

  @Index()
  @Column({ type: 'enum', enum: RuntimeLanguage })
  language: RuntimeLanguage;

  @Column({ default: false, nullable: true })
  isShared: boolean;

  @Column({ type: 'jsonb', nullable: true })
  pageSettings: any;

  @Column({ type: 'jsonb', nullable: true })
  usedDeps: any;

  @Column({ type: 'jsonb', nullable: true })
  usedUiFrameworks: string[];

  @Column({ default: false, nullable: true })
  isSetup: boolean;

  @Column({ default: false, nullable: true })
  imageUploaded: boolean;

  @Column({ nullable: true, unique: true })
  publishingDomain: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, (user) => user.components)
  user: User;

  @OneToMany(() => Theme, (theme) => theme.component)
  themes: Theme[];

  @Column({ default: 0 })
  upvotesCount: number;

  @OneToMany(() => Upvote, (upvote) => upvote.component)
  upvotes: Upvote[];

  @Index()
  @Column({
    type: 'enum',
    enum: ComponentVisibility,
    default: ComponentVisibility.DRAFT,
  })
  visibility: ComponentVisibility;
}
