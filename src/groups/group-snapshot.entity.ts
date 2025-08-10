import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Group } from './group.entity';

@Entity()
export class GroupSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // JSON stringified of GroupSnapshotDetail[]
  @Column({ type: 'text', nullable: true })
  snapshotDetails: string;

  @ManyToOne(() => Group, group => group.snapshots)
  @JoinColumn({ name: 'groupId' })
  group: Group;
}

export class GroupSnapshotDetail {
  projectId: number;
  projectSnapshotId: number;
  projectName: string;
  failedPrs: number;
  totalPrs: number;
}
