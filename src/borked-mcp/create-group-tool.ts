import { Injectable, Logger } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";
import z from "zod";

@Injectable()
export class CreateGroupTool {
    private readonly logger = new Logger(CreateGroupTool.name);
    
    constructor(
        private readonly groupService: GroupService
    ) { }

    @Tool({
        name: 'create-or-update-group-tool',
        description: 'Creates a new group of projects, or updates the name of an existing group, based on ID. IDs should be alphanumeric and hyphens only.',
        parameters: z.object({
            id: z.string(),
            name: z.string(),
        }),
    })
    async createGroup({ id, name }, _context: Context) {
        try {
            id = id.replace(/[^a-zA-Z0-9-]/g, '');
            const group = await this.groupService.createOrUpdate(id, name);

            return group;
        }
        catch (ex) {
            this.logger.error(ex);
            throw ex;
        }
    }
}