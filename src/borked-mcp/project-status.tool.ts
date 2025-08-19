import { Injectable, Logger } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { OpenPullRequestService } from "src/projects/open-pull-request.service";
import { ProjectSnapshotService } from "src/projects/project-snapshot.service";
import { ProjectService } from "src/projects/project.service";
import z from "zod";

@Injectable()
export class ProjectStatusTool {
    private readonly logger = new Logger(ProjectStatusTool.name);

    constructor(
        private readonly projectService: ProjectService,
        private readonly openPullRequestService: OpenPullRequestService,
        private readonly projectSnapshotService: ProjectSnapshotService,
    ) { }

    @Tool({
        name: 'project-status-tool',
        description: 'Returns the details of a project (or repository), including PR statuses, and the latest pass/fail trends for the repository.',
        parameters: z.object({
            projectId: z.string(),
        }),
    })
    async projectStatus({ projectId }, _context: Context) {
        try {
            const project = await this.projectService.findByExternalId(projectId, []);

            if (!project) {
                return `Project with ID '${projectId}' not found`;
            }

            const failingPrs = (await this.openPullRequestService.findByProject(project.id)).filter(pr => !pr.allChecksPassed).map(pr => ({ number: pr.number, title: pr.title, createdAt: pr.createdAt }));
            failingPrs.sort((a, b) => b.number - a.number);
            const snapshots = await this.projectSnapshotService.findPaginatedByProject(project.id, 1);

            return {
                project,
                snapshots,
                failingPrs
            }
        }
        catch (ex) {
            this.logger.error(ex);
            throw ex;
        }
    }
}