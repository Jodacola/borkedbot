import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Group } from '../groups/group.entity';
import { OpenPullRequest } from './open-pull-request.entity';
import { ProjectSnapshot } from './project-snapshot.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: () => "''" })
  externalId: string;

  @Column({ nullable: true })
  defaultBranchName: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  githubRepo: string;

  @Column({ type: 'datetime', nullable: true })
  lastSync: Date;

  @Column({ type: 'boolean', nullable: true })
  defaultBranchStatus: boolean;

  @Column({ type: 'int', default: 0 })
  openPrs: number;

  @Column({ type: 'int', default: 0 })
  failingPrs: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Group, group => group.projects)
  @JoinColumn()
  group: Group;

  @OneToMany(() => OpenPullRequest, openPullRequest => openPullRequest.project, { cascade: true, onDelete: 'CASCADE' })
  openPullRequests: OpenPullRequest[];

  @OneToMany(() => ProjectSnapshot, snapshot => snapshot.project, { cascade: true, onDelete: 'CASCADE' })
  snapshots: ProjectSnapshot[];
}
