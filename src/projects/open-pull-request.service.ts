import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OpenPullRequest } from './open-pull-request.entity';
import { Project } from './project.entity';
import { PullRequestStatus } from '../github/github.service';

@Injectable()
export class OpenPullRequestService {
  constructor(
    @InjectRepository(OpenPullRequest)
    private openPullRequestRepository: Repository<OpenPullRequest>,
  ) { }

  async findByProject(projectId: number): Promise<OpenPullRequest[]> {
    return await this.openPullRequestRepository.find({
      where: { project: { id: projectId } },
      relations: ['project'],
    });
  }

  async findByProjectAndNumbers(projectId: number, numbers: number[]): Promise<OpenPullRequest[]> {
    return await this.openPullRequestRepository.find({
      where: {
        project: { id: projectId },
        number: In(numbers),
      },
      relations: ['project'],
    });
  }

  async createOrUpdate(
    project: Project,
    pullRequestData: PullRequestStatus,
  ): Promise<OpenPullRequest> {
    let openPullRequest = await this.openPullRequestRepository.findOne({
      where: {
        project: { id: project.id },
        number: pullRequestData.number,
      },
    });

    if (openPullRequest) {
      openPullRequest.title = pullRequestData.title;
      openPullRequest.lastUpdated = pullRequestData.lastUpdated;

      if (pullRequestData.updated) {
        openPullRequest.allChecksPassed = pullRequestData.allChecksPassed;
      }
    } else {
      openPullRequest = this.openPullRequestRepository.create({
        project,
        number: pullRequestData.number,
        title: pullRequestData.title,
        lastUpdated: pullRequestData.lastUpdated,
        allChecksPassed: pullRequestData.allChecksPassed,
      });
    }

    return await this.openPullRequestRepository.save(openPullRequest);
  }

  async deleteByProjectAndNumbers(projectId: number, numbers: number[]): Promise<void> {
    if (numbers.length === 0) return;

    await this.openPullRequestRepository.delete({
      project: { id: projectId },
      number: In(numbers),
    });
  }

  async deleteAllByProject(projectId: number): Promise<void> {
    await this.openPullRequestRepository.delete({
      project: { id: projectId },
    });
  }
}
