import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class OpenPullRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  number: number;

  @Column()
  title: string;

  @Column({ type: 'datetime' })
  lastUpdated: Date;

  @Column({ type: 'boolean' })
  allChecksPassed: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Project, project => project.openPullRequests)
  @JoinColumn()
  project: Project;
} 