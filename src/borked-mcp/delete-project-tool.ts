import { Injectable, Logger } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { ProjectService } from "src/projects/project.service";
import z from "zod";

@Injectable()
export class DeleteProjectTool {
    private readonly logger = new Logger(DeleteProjectTool.name);

    constructor(
        private readonly projectService: ProjectService
    ) { }

    @Tool({
        name: 'delete-project-tool',
        description: 'Deletes a project and all its associated pull requests and snapshots. This action cannot be undone.',
        parameters: z.object({
            id: z.string().describe('The external ID of the project to delete'),
        }),
    })
    async deleteProject({ id }, _context: Context) {
        try {
            await this.projectService.deleteProject(id);

            return {
                success: true,
                message: `Project '${id}' has been successfully deleted along with all associated data.`
            };
        }
        catch (ex) {
            this.logger.error(ex);
            throw ex;
        }
    }
}
