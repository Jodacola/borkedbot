import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ProjectSnapshot } from './project-snapshot.entity';

@Injectable()
export class ProjectSnapshotService {
  constructor(
    @InjectRepository(ProjectSnapshot)
    private projectSnapshotRepository: Repository<ProjectSnapshot>,
  ) { }

  async createSnapshot(
    projectId: number,
    numberOfPrs: number,
    numberOfFailedPrs: number,
    failedPrNumbers: number[]
  ): Promise<ProjectSnapshot> {
    const snapshot = this.projectSnapshotRepository.create({
      projectId,
      numberOfPrs,
      numberOfFailedPrs,
      failedPrNumbers: JSON.stringify(failedPrNumbers),
    });

    return this.projectSnapshotRepository.save(snapshot);
  }

  async findByProject(projectId: number): Promise<ProjectSnapshot[]> {
    return this.projectSnapshotRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByProjectAndDateRange(
    projectId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ProjectSnapshot[]> {
    const results = await this.projectSnapshotRepository.find({
      where: {
        projectId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    return results;
  }

  async findLatestByProject(projectId: number): Promise<ProjectSnapshot | null> {
    return this.projectSnapshotRepository.findOne({
      where: { projectId },
      order: { createdAt: 'DESC' },
      relations: ['project'],
    });
  }

  async findAll(): Promise<ProjectSnapshot[]> {
    return this.projectSnapshotRepository.find({
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPaginatedByProject(
    projectId: number,
    page: number = 1,
    limit: number = 50
  ): Promise<{ snapshots: ProjectSnapshot[]; total: number; page: number; totalPages: number }> {
    page = Math.max(page, 1);
    limit = Math.max(limit, 1);
    const skip = (page - 1) * limit;

    const [snapshots, total] = await this.projectSnapshotRepository.findAndCount({
      where: { projectId },
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

  // Helper method to get failedPrNumbers as array
  getFailedPrNumbersAsArray(snapshot: ProjectSnapshot): number[] {
    if (!snapshot.failedPrNumbers) {
      return [];
    }
    try {
      return JSON.parse(snapshot.failedPrNumbers);
    } catch {
      return [];
    }
  }
} 