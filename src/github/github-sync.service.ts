import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project } from '../projects/project.entity';
import { OpenPullRequestService } from '../projects/open-pull-request.service';
import { GithubService, PullRequestStatus } from './github.service';
import { ConfigService } from '@nestjs/config';
import { ProjectSnapshotService } from '../projects/project-snapshot.service';
import { ProjectSnapshot } from 'src/projects/project-snapshot.entity';
import { Group } from 'src/groups/group.entity';
import { GroupSnapshotService } from 'src/groups/group-snapshot.service';

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
        @InjectRepository(Group)
        private groupRepository: Repository<Group>,
        private projectSnapshotService: ProjectSnapshotService,
        private groupSnapshotService: GroupSnapshotService
    ) {
        this.enabled = this.configService.get<string>('github.syncEnabled') === 'true';
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async syncAllGroups() {
        if (!this.enabled) {
            this.logger.log('GitHub sync is disabled');
            return;
        }

        if (!this.githubService.isEnabled()) {
            this.logger.warn('GitHub is disabled, skipping sync; ensure the GithubService is properly configured');
            return;
        }

        this.logger.log('Starting GitHub sync for all groups');
        const groups = await this.groupRepository.find({
            relations: ['projects']
        });

        const startDate = new Date();

        const projectIds = Array.from(new Set(groups.flatMap(group => group.projects.map(project => project.id))));
        const projectSnapshots = await this.syncProjects(projectIds);

        for (const group of groups) {
            const groupProjectIds = group.projects.map(project => project.id);
            const groupProjectSnapshots = projectSnapshots.filter(snapshot =>
                groupProjectIds.includes(snapshot.projectId)
            );

            if (groupProjectSnapshots.some(snapshot => snapshot.createdAt >= startDate)) {
                await this.updateGroupSnapshot(group, groupProjectSnapshots);
            }
        }
    }

    async syncProjects(projectIds: number[]): Promise<ProjectSnapshot[]> {
        this.logger.log('Starting GitHub sync for all projects');
        const projects = await this.projectRepository.find({
            where: { id: In(projectIds) },
        });

        const projectSnapshots: ProjectSnapshot[] = [];

        for (const project of projects) {
            try {
                const projectSnapshot = await this.syncProject(project);
                if (projectSnapshot) {
                    projectSnapshots.push(projectSnapshot);
                }
            } catch (error) {
                this.logger.error(`Failed to sync project ${project.name}: ${error.message}`);
            }
        }

        this.logger.log(`Successfully synced ${projectSnapshots.length} projects`);

        return projectSnapshots;
    }

    private async syncProject(project: Project): Promise<ProjectSnapshot | null> {
        const [owner, repo] = project.githubRepo.split('/');
        if (!owner || !repo) {
            this.logger.warn(`Invalid GitHub repo format for project ${project.name}: ${project.githubRepo}`);
            return null;
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

            const projectSnapshot = await this.updateProjectSnapshot(project, latestPrs, failedPrNumbers);

            this.logger.log(`Successfully synced project ${project.name}`);

            return projectSnapshot;
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

        this.logger.log(`  PRs to keep: ${latestNumbers.length}`);
        this.logger.log(`  PRs to delete: ${numbersToDelete.length}`);

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

    private async updateProjectSnapshot(project: Project, pullRequests: PullRequestStatus[], failedPrNumbers: number[]): Promise<ProjectSnapshot> {
        let currentSnapshot = await this.projectSnapshotService.findLatestByProject(project.id);
        let addNewSnapshot = !currentSnapshot;

        if (currentSnapshot) {
            const sortedPrevFailedPrs = [...this.projectSnapshotService.getFailedPrNumbersAsArray(currentSnapshot)].sort((a, b) => a - b);
            const sortedNewFailedPrs = [...failedPrNumbers].sort((a, b) => a - b);

            addNewSnapshot = currentSnapshot.createdAt < new Date(Date.now() - 1000 * 60 * 60 * 24) ||
                currentSnapshot.numberOfPrs !== pullRequests.length ||
                currentSnapshot.numberOfFailedPrs !== failedPrNumbers.length ||
                sortedPrevFailedPrs.length !== sortedNewFailedPrs.length ||
                sortedPrevFailedPrs.some((num, idx) => num !== sortedNewFailedPrs[idx]);
        }

        if (addNewSnapshot) {
            currentSnapshot = await this.projectSnapshotService.createSnapshot(
                project.id,
                pullRequests.length,
                failedPrNumbers.length,
                failedPrNumbers
            );

            currentSnapshot.project = project;
        }

        return currentSnapshot!;
    }

    private async updateGroupSnapshot(group: Group, projectSnapshots: ProjectSnapshot[]) {
        await this.groupSnapshotService.createSnapshot(
            group.id,
            projectSnapshots
                .sort((a, b) => a.project.name.localeCompare(b.project.name))
                .map(snapshot => ({
                    projectId: snapshot.projectId,
                    projectSnapshotId: snapshot.id,
                    projectName: snapshot.project.name,
                    failedPrs: snapshot.numberOfFailedPrs,
                    totalPrs: snapshot.numberOfPrs
                }))
        )

        this.logger.log(`Updated group snapshot for group ${group.name}`);
    }
}
