import { Injectable, Logger } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";
import { ProjectService } from "src/projects/project.service";
import z from "zod";

@Injectable()
export class CreateProjectTool {
    private readonly logger = new Logger(CreateProjectTool.name);

    constructor(
        private readonly groupService: GroupService,
        private readonly projectService: ProjectService,
    ) { }

    @Tool({
        name: 'create-or-update-project',
        description: 'Creates a project, or updates the details of an existing project, based on ID. IDs should be alphanumeric and hyphens only. githubRepo should be the full name of the repository, such as "org/repo". url should be the full URL of the repository, such as "https://github.com/org/repo".',
        parameters: z.object({
            id: z.string(),
            githubRepo: z.string(),
            groupId: z.string(),
            name: z.string(),
            url: z.string(),
        }),
    })
    async createProject({ id, githubRepo, groupId, url, name }, _context: Context) {
        try {
            id = id.replace(/[^a-zA-Z0-9-]/g, '');
            const group = await this.groupService.findByExternalId(groupId);

            if (!group) {
                return `Group with ID '${groupId}' not found`;
            }

            const project = await this.projectService.createOrUpdate(
                id,
                name,
                githubRepo,
                url,
                group
            );

            return project;
        }
        catch (ex) {
            this.logger.error(ex);
            throw ex;
        }
    }
}