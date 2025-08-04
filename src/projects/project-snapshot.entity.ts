import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class ProjectSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'int' })
  numberOfPrs: number;

  @Column({ type: 'int' })
  numberOfFailedPrs: number;

  @Column({ type: 'text', nullable: true })
  failedPrNumbers: string;

  @ManyToOne(() => Project, project => project.snapshots)
  @JoinColumn({ name: 'projectId' })
  project: Project;
} 