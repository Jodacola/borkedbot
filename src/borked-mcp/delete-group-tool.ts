import { Injectable, Logger } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";
import z from "zod";

@Injectable()
export class DeleteGroupTool {
    private readonly logger = new Logger(DeleteGroupTool.name);

    constructor(
        private readonly groupService: GroupService
    ) { }

    @Tool({
        name: 'delete-group-tool',
        description: 'Deletes a group and all its associated projects, pull requests, and snapshots. This action cannot be undone.',
        parameters: z.object({
            id: z.string().describe('The external ID of the group to delete'),
        }),
    })
    async deleteGroup({ id }, _context: Context) {
        try {
            await this.groupService.deleteGroup(id);
            
            return {
                success: true,
                message: `Group '${id}' has been successfully deleted along with all associated data.`
            };
        }
        catch (ex) {
            this.logger.error(ex);
            throw ex;
        }
    }
}
