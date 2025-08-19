import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { OpenPullRequestService } from 'src/projects/open-pull-request.service';
import { ProjectService } from 'src/projects/project.service';
import { GroupSnapshotService } from './group-snapshot.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    private readonly projectService: ProjectService,
    private readonly openPullRequestService: OpenPullRequestService,
    private readonly groupSnapshotService: GroupSnapshotService
  ) { }

  async findByExternalId(externalId: string): Promise<Group | null> {
    return this.groupRepository.findOne({ where: { externalId } });
  }

  async createOrUpdate(externalId: string, name: string): Promise<Group> {
    let group = await this.findByExternalId(externalId);

    if (group) {
      // Update existing group
      group.name = name;
      return this.groupRepository.save(group);
    } else {
      // Create new group
      group = this.groupRepository.create({
        externalId,
        name,
      });
      return this.groupRepository.save(group);
    }
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find({ relations: ['projects'] });
  }

  async deleteGroup(externalId: string): Promise<void> {
    const group = await this.findByExternalId(externalId);
    
    if (!group) {
      throw new NotFoundException(`Group with ID '${externalId}' not found`);
    }

    await this.groupRepository.remove(group);
  }

  async findGroupWithProjectInfo(groupExternalId: string, page: number) {
    const group = await this.findByExternalId(groupExternalId);

    if (!group) {
      throw new NotFoundException(`Group with ID '${groupExternalId}' not found`);
    }

    const baseProjects = await this.projectService.findByGroup(group.id);

    baseProjects.sort((a, b) => a.name.localeCompare(b.name));

    const projectsWithPrs = await Promise.all(baseProjects.map(async project => ({
      ...project,
      prs: (await this.openPullRequestService.findByProject(project.id))
    })));

    projectsWithPrs.forEach(proj => {
      proj.prs.sort((a, b) => b.number - a.number);
    });

    const paginatedSnapshots = await this.groupSnapshotService.findPaginatedByGroup(group.id, page);

    return {
      group,
      projects: projectsWithPrs,
      snapshots: paginatedSnapshots
    };
  }
} 