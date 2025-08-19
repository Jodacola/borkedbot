import { Injectable } from "@nestjs/common";
import { Context, Tool } from "@rekog/mcp-nest";
import { GroupService } from "src/groups/group.service";

@Injectable()
export class ListGroupsTool {
    constructor(
        private readonly groupService: GroupService,
    ) { }

    @Tool({
        name: 'list-groups-tool',
        description: 'Returns the list of configured GitHub repository groups for BorkedBot statuses.',
    })
    async listGroups(_context: Context) {
        return (await this.groupService.findAll()).map(g => ({ id: g.externalId, name: g.name }));
    }
}