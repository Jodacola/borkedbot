import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Project } from '../projects/project.entity';
import { GroupSnapshot } from './group-snapshot.entity';

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: () => "''" })
  externalId: string;

  @Column()
  name: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Project, project => project.group)
  projects: Project[];

  @OneToMany(() => GroupSnapshot, snapshot => snapshot.group)
  snapshots: GroupSnapshot[];
} 