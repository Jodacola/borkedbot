import { Injectable } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";
import { ProjectService } from "src/projects/project.service";
import z from "zod";

@Injectable()
export class ListProjectsTool {
    constructor(
        private readonly groupService: GroupService,
        private readonly projectService: ProjectService,
    ) { }

    @Tool({
        name: 'list-projects-tool',
        description: 'Returns the list of configured GitHub repositories for the provided group.',
        parameters: z.object({
            groupId: z.string(),
        }),
    })
    async listProjects({ groupId }, _context: Context) {
        const group = await this.groupService.findByExternalId(groupId);

        if (!group) {
            return `Group with ID '${groupId}' not found`;
        }

        const projects = await this.projectService.findByGroup(group.id);

        return projects.map(p => ({ id: p.externalId, name: p.name }));
    }
}