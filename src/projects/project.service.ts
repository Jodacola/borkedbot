import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { Group } from '../groups/group.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) { }

  async findByExternalId(externalId: string, relations = ['group']): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { externalId }, relations });
  }

  async createOrUpdate(
    externalId: string,
    name: string,
    githubRepo: string,
    url: string,
    group: Group
  ): Promise<Project> {
    let project = await this.findByExternalId(externalId);

    if (project) {
      // Update existing project
      project.name = name;
      project.githubRepo = githubRepo;
      project.url = url;
      project.group = group;
      return this.projectRepository.save(project);
    } else {
      // Create new project
      project = this.projectRepository.create({
        externalId,
        name,
        githubRepo,
        url,
        group
      });
      return this.projectRepository.save(project);
    }
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({ relations: ['group'] });
  }

  async findByGroup(groupId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { group: { id: groupId } },
      relations: ['group']
    });
  }

  async deleteProject(externalId: string): Promise<void> {
    const project = await this.findByExternalId(externalId);
    
    if (!project) {
      throw new NotFoundException(`Project with ID '${externalId}' not found`);
    }

    await this.projectRepository.remove(project);
  }
} 