import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

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
} 