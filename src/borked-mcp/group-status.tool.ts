import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";
import z from "zod";

@Injectable()
export class GroupStatusTool {
    private readonly logger = new Logger(GroupStatusTool.name);

    constructor(
        private readonly groupService: GroupService,
    ) { }

    @Tool({
        name: 'group-status-tool',
        description: 'Returns the details of a group, including projects and PR statuses for the groups, as well as failing PRs for all the groups and the latest pass/fail trends for repositories in the group.',
        parameters: z.object({
            groupId: z.string(),
        }),
    })
    async groupStatus({ groupId }, _context: Context) {
        try {
            const { group, projects, snapshots } = await this.groupService.findGroupWithProjectInfo(groupId, 1);

            const resultProjects = projects.map(proj => ({
                id: proj.externalId,
                name: proj.name,
                url: proj.url,
                githubRepo: proj.githubRepo,
                defaultBranchName: proj.defaultBranchName,
                defaultBranchStatus: proj.defaultBranchStatus,
                openPrs: proj.openPrs,
                failingPrs: proj.failingPrs,
                lastSync: proj.lastSync,
                prs: proj.prs.map(pr => ({ number: pr.number, title: pr.title, allChecksPassed: pr.allChecksPassed, createdAt: pr.createdAt }))
            }));

            return {
                group,
                projects: resultProjects,
                snapshots
            }
        }
        catch (ex) {
            this.logger.error(ex);

            if (ex instanceof NotFoundException) {
                return `Group with ID '${groupId}' not found`;
            }

            throw ex;
        }
    }
}