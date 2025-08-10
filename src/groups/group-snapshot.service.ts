import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { GroupSnapshot, GroupSnapshotDetail } from './group-snapshot.entity';

@Injectable()
export class GroupSnapshotService {
  constructor(
    @InjectRepository(GroupSnapshot)
    private groupSnapshotRepository: Repository<GroupSnapshot>,
  ) { }

  async createSnapshot(
    groupId: number,
    groupSnapshotDetails: GroupSnapshotDetail[]
  ): Promise<GroupSnapshot> {
    const snapshot = this.groupSnapshotRepository.create({
      groupId,
      snapshotDetails: JSON.stringify(groupSnapshotDetails),
    });

    return this.groupSnapshotRepository.save(snapshot);
  }

  async findByGroup(groupId: number): Promise<GroupSnapshot[]> {
    return this.groupSnapshotRepository.find({
      where: { groupId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByGroupAndDateRange(
    groupId: number,
    startDate: Date,
    endDate: Date
  ): Promise<GroupSnapshot[]> {
    const results = await this.groupSnapshotRepository.find({
      where: {
        groupId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    return results;
  }

  async findLatestByGroup(groupId: number): Promise<GroupSnapshot | null> {
    return this.groupSnapshotRepository.findOne({
      where: { groupId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<GroupSnapshot[]> {
    return this.groupSnapshotRepository.find({
      relations: ['group'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedByGroup(
    groupId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ snapshots: GroupSnapshot[]; total: number; page: number; totalPages: number }> {
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;

    const [snapshots, total] = await this.groupSnapshotRepository.findAndCount({
      where: { groupId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      snapshots,
      total,
      page,
      totalPages,
    };
  }

  getSnapshotDetails(snapshot: GroupSnapshot): GroupSnapshotDetail[] {
    if (!snapshot.snapshotDetails) {
      return [];
    }
    try {
      return JSON.parse(snapshot.snapshotDetails);
    } catch {
      return [];
    }
  }
} 