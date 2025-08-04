import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Project } from '../projects/project.entity';
import { OpenPullRequestService } from '../projects/open-pull-request.service';
import { GithubService, PullRequestStatus } from './github.service';
import { ConfigService } from '@nestjs/config';
import { ProjectService } from '../projects/project.service';
import { ProjectSnapshotService } from '../projects/project-snapshot.service';

@Injectable()
export class GithubSyncService {
    private readonly logger = new Logger(GithubSyncService.name);
    private enabled = false;

    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        private openPullRequestService: OpenPullRequestService,
        private githubService: GithubService,
        private configService: ConfigService,
        private projectService: ProjectService,
        private projectSnapshotService: ProjectSnapshotService
    ) {
        this.enabled = this.configService.get<string>('github.syncEnabled') === 'true';
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncAllProjects() {
        if (!this.enabled) {
            this.logger.log('GitHub sync is disabled');
            return;
        }

        this.logger.log('Starting GitHub sync for all projects');
        const projects = await this.projectRepository.find({
            where: { githubRepo: Not(IsNull()) },
        });

        for (const project of projects) {
            try {
                await this.syncProject(project);
            } catch (error) {
                this.logger.error(`Failed to sync project ${project.name}: ${error.message}`);
            }
        }
    }

    private async syncProject(project: Project) {
        const [owner, repo] = project.githubRepo.split('/');
        if (!owner || !repo) {
            this.logger.warn(`Invalid GitHub repo format for project ${project.name}: ${project.githubRepo}`);
            return;
        }

        try {
            this.logger.log(`Syncing project ${project.name}`);

            let existingPullRequests = await this.openPullRequestService.findByProject(project.id);

            this.logger.log(`${project.name} lasy sync: ${project.lastSync}, existing PRs: ${existingPullRequests.length}`);

            const { latestRepoInfo, latestDefaultBranchStatus, latestPrs, latestPrNumbers, latestFailingPrNumbers } =
                await this.getLatestFromGithub(project, owner, repo);

            await this.deleteRemovedPrs(
                project,
                existingPullRequests.map(pr => pr.number),
                latestPrNumbers);

            await this.createOrUpdatePrs(project, latestPrs);

            existingPullRequests = await this.openPullRequestService.findByProject(project.id);

            this.logger.log(`Synced ${latestPrs.length} pull requests for project ${project.name}`);

            const latestNotUpdatedPrs = latestPrs.filter(pr => !pr.updated);
            const existingNotUpdatedPrs = existingPullRequests.filter(pr => latestNotUpdatedPrs.some(latestPr => latestPr.number === pr.number));
            const existingNotUpdatedFailingPrs = existingNotUpdatedPrs
                .filter(pr => !pr.allChecksPassed)
                .map(pr => pr.number);

            const totalFailingPrs = latestFailingPrNumbers.length + existingNotUpdatedFailingPrs.length;
            const failedPrNumbers = [
                ...latestFailingPrNumbers,
                ...existingNotUpdatedFailingPrs
            ];

            await this.projectRepository.update(project.id, {
                lastSync: new Date(),
                defaultBranchName: latestRepoInfo.defaultBranch,
                defaultBranchStatus: latestDefaultBranchStatus.allChecksPassed,
                openPrs: latestPrs.length,
                failingPrs: totalFailingPrs,
            });

            await this.updateSnapshot(project, latestPrs, failedPrNumbers);

            this.logger.log(`Successfully synced project ${project.name}`);
        } catch (error) {
            this.logger.error(`Error syncing project ${project.name}: ${error.message}`);
            throw error;
        }
    }

    private async getLatestFromGithub(project: Project, owner: string, repo: string) {
        const latestRepoInfo = await this.githubService.getRepositoryInfo(owner, repo);
        const latestDefaultBranchStatus = await this.githubService.getRepositoryStatus(owner, repo);
        const latestPrs = await this.githubService.getPullRequests(owner, repo);
        const latestPrNumbers = latestPrs.map(pr => pr.number);
        const latestFailingPrNumbers = latestPrs.filter(pr => pr.updated && !pr.allChecksPassed).map(pr => pr.number);

        this.logger.log(`Latest PRs: ${latestPrs.length}`);
        this.logger.log(`Latest failing PR numbers: ${latestFailingPrNumbers.length}`);

        return {
            latestRepoInfo,
            latestDefaultBranchStatus,
            latestPrs,
            latestPrNumbers,
            latestFailingPrNumbers
        }
    }

    private async deleteRemovedPrs(project: Project, existingNumbers: number[], latestNumbers: number[]) {
        this.logger.log(`Deleting removed PRs for project ${project.name}`);
        const numbersToDelete = existingNumbers.filter(num => !latestNumbers.includes(num));

        this.logger.log(`PRs to keep: ${latestNumbers.length}`);
        this.logger.log(`PRs to delete: ${numbersToDelete.length}`);

        if (numbersToDelete.length > 0) {
            this.logger.log(`Deleting PR numbers: ${numbersToDelete}`);
            await this.openPullRequestService.deleteByProjectAndNumbers(project.id, numbersToDelete);
            this.logger.log(`Deleted ${numbersToDelete.length} pull requests for project ${project.name}`);
        }
    }

    private async createOrUpdatePrs(project: Project, pullRequests: PullRequestStatus[]) {
        for (const pullRequest of pullRequests) {
            await this.openPullRequestService.createOrUpdate(project, pullRequest);
        }
    }

    private async updateSnapshot(project: Project, pullRequests: PullRequestStatus[], failedPrNumbers: number[]) {
        const lastSnapshot = await this.projectSnapshotService.findLatestByProject(project.id);
        let addNewSnapshot = !lastSnapshot;

        if (lastSnapshot) {
            const sortedPrevFailedPrs = [...this.projectSnapshotService.getFailedPrNumbersAsArray(lastSnapshot)].sort((a, b) => a - b);
            const sortedNewFailedPrs = [...failedPrNumbers].sort((a, b) => a - b);

            addNewSnapshot = lastSnapshot.createdAt < new Date(Date.now() - 1000 * 60 * 60 * 24) ||
                lastSnapshot.numberOfPrs !== pullRequests.length ||
                lastSnapshot.numberOfFailedPrs !== failedPrNumbers.length ||
                sortedPrevFailedPrs.length !== sortedNewFailedPrs.length ||
                sortedPrevFailedPrs.some((num, idx) => num !== sortedNewFailedPrs[idx]);
        }

        if (addNewSnapshot) {
            await this.projectSnapshotService.createSnapshot(
                project.id,
                pullRequests.length,
                failedPrNumbers.length,
                failedPrNumbers
            );
        }
    }
}
