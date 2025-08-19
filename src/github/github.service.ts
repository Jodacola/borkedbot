import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { EnhancedPullRequest } from './github.types';

type CheckRun = RestEndpointMethodTypes["checks"]["listForRef"]["response"]["data"]["check_runs"][number];
export type PullRequest = RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number];

export interface CheckStatus {
    name: string;
    status: 'completed' | 'in_progress' | 'queued' | 'waiting' | 'requested' | 'pending';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'stale' | 'skipped' | null;
    detailsUrl?: string;
    startedAt: Date;
    completedAt?: Date;
}

export interface PullRequestStatus {
    number: number;
    title: string;
    updated: boolean;
    lastUpdated: Date;
    allChecksPassed: boolean;
}

export interface RepositoryStatus {
    isUpToDate: boolean;
    lastUpdated: Date;
    checks: CheckStatus[];
    allChecksPassed: boolean;
}

@Injectable()
export class GithubService {
    private readonly logger = new Logger(GithubService.name);
    private enabled = false;
    private octokit: Octokit | null = null;

    constructor(private configService: ConfigService) {
        const token = this.configService.get<string>('github.token');
        if (!token) {
            this.logger.error('GitHub token is not configured. Please set the GITHUB_TOKEN environment variable or add it to your .env file.');
            return;
        }

        this.enabled = true;

        this.octokit = new Octokit({
            auth: token,
        });
    }

    public isEnabled() {
        return this.enabled;
    }

    async getRepositoryInfo(owner: string, repo: string) {
        this.logger.log(`Getting repository info for ${owner}/${repo}`);
        const { data } = await this.octokit!.repos.get({
            owner,
            repo,
        });

        return {
            name: data.name,
            owner: data.owner.login,
            defaultBranch: data.default_branch,
        };
    }

    private async getAllChecks(owner: string, repo: string, ref: string): Promise<CheckRun[]> {
        const allCheckRuns: CheckRun[] = [];

        let page = 1;
        while (true) {
            this.logger.log(`Getting checks for ${owner}/${repo}@${ref} (page ${page})`);
            const result = await this.octokit!.checks.listForRef({
                owner,
                repo,
                ref,
                per_page: 100,
                page,
            });

            allCheckRuns.push(...result.data.check_runs);

            if (result.data.check_runs.length < 100) {
                break;
            }

            page++;
        }

        return allCheckRuns;
    }

    private async getChecksForRef(owner: string, repo: string, ref: string): Promise<CheckStatus[]> {
        const checkRuns = await this.getAllChecks(owner, repo, ref);

        return checkRuns.map((check) => ({
            name: check.name,
            status: check.status,
            conclusion: check.conclusion,
            detailsUrl: check.details_url || undefined,
            startedAt: new Date(check.started_at || new Date()),
            completedAt: check.completed_at ? new Date(check.completed_at) : undefined,
        }));
    }

    private hasFailedChecks(checks: CheckStatus[]): boolean {
        return checks.some(
            (check) => check.status === 'completed' && check.conclusion === 'failure'
        );
    }

    async getAllPullRequests(owner: string, repo: string): Promise<EnhancedPullRequest[]> {
        const allPullRequests: PullRequest[] = [];

        let page = 1;

        while (true) {
            this.logger.log(`Getting pull requests for ${owner}/${repo} (page ${page})`);
            const result = await this.octokit!.pulls.list({
                owner,
                repo,
                state: 'open',
                per_page: 100,
                page,
                sort: 'created',
                direction: 'asc'
            });

            allPullRequests.push(...result.data);

            if (result.data.length < 100) {
                break;
            }

            page++;
        }

        return allPullRequests.map((pr) => ({
            ...pr,
            updated: true,
        }));
    }

    async getPullRequests(owner: string, repo: string): Promise<PullRequestStatus[]> {
        const pulls = await this.getAllPullRequests(owner, repo);

        this.logger.log(`Found ${pulls.length} pull requests`);

        const pullRequestsWithChecks: PullRequestStatus[] = [];

        // Process pull requests in batches of 10 for parallel execution
        const batchSize = 10;
        for (let i = 0; i < pulls.length; i += batchSize) {
            const batch = pulls.slice(i, i + batchSize);

            const batchPromises = batch.map(async (pull) => {
                if (!pull.updated) {
                    this.logger.log(`[Checks] Pull request ${pull.number} is not updated, skipping check pull`);
                    return {
                        number: pull.number,
                        title: pull.title,
                        lastUpdated: new Date(pull.updated_at),
                        updated: false,
                        allChecksPassed: false,
                    };
                }

                this.logger.log(`[Checks] Getting checks for PR #${pull.number}`);
                const checks = await this.getChecksForRef(owner, repo, pull.head.sha);
                const allChecksPassed = !this.hasFailedChecks(checks);

                return {
                    number: pull.number,
                    title: pull.title,
                    lastUpdated: new Date(pull.updated_at),
                    updated: true,
                    allChecksPassed,
                };
            });

            const batchResults = await Promise.all(batchPromises);
            pullRequestsWithChecks.push(...batchResults);
        }

        return pullRequestsWithChecks;
    }

    async getRepositoryStatus(owner: string, repo: string): Promise<RepositoryStatus> {
        this.logger.log(`Getting repository status for ${owner}/${repo}`);
        const { data: repoInfo } = await this.octokit!.repos.get({
            owner,
            repo,
        });

        // Get the latest commit on the default branch
        const { data: latestCommit } = await this.octokit!.repos.getBranch({
            owner,
            repo,
            branch: repoInfo.default_branch,
        });

        const checks = await this.getChecksForRef(owner, repo, latestCommit.commit.sha);

        const allChecksPassed = !this.hasFailedChecks(checks);

        return {
            isUpToDate: allChecksPassed,
            lastUpdated: new Date(Math.max(...checks.map((c) => c.startedAt.getTime()))),
            checks,
            allChecksPassed,
        };
    }
} 