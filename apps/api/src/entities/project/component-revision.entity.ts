import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Component, ComponentVisibility } from './component.entity';

/** An immutable CLI-published registry artifact.  Component remains the
 * mutable "latest" pointer; rows in this table are never updated. */
@Entity()
@Unique('UQ_component_revision_component_digest', ['component', 'digest'])
@Unique('UQ_component_revision_component_revision', ['component', 'revision'])
export class ComponentRevision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Component, (component) => component.revisions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  component: Component;

  @Index()
  @Column({ type: 'char', length: 64 })
  digest: string;

  @Column({ type: 'integer' })
  revision: number;

  @Column({ type: 'smallint' })
  schemaVersion: number;

  @Column({
    type: 'enum',
    enum: ComponentVisibility,
    enumName: 'component_visibility_enum',
  })
  visibility: ComponentVisibility;

  // The reviewed v2 registry item is the artifact. Keeping it directly avoids
  // reconstructing (and potentially losing) registry fields in later code.
  @Column({ type: 'jsonb' })
  registryItem: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
