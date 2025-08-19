import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ListGroupsTool } from './list-groups.tool';
import { GroupModule } from 'src/groups/group.module';
import { ProjectModule } from 'src/projects/project.module';
import { ListProjectsTool } from './list-projects.tool';
import { GroupStatusTool } from './group-status.tool';
import { ProjectStatusTool } from './project-status.tool';
import { CreateGroupTool } from './create-group-tool';
import { CreateProjectTool } from './create-project-tool';
import { DeleteGroupTool } from './delete-group-tool';
import { DeleteProjectTool } from './delete-project-tool';

@Module({
    imports: [McpModule.forRoot({
        name: 'borkedbot-mcp-server',
        version: '1.0.0',
        instructions: 'This is the MCP server for BorkedBot. It is used to manage and review custom groups of GitHub repositories and get statuses for those groups and the projects in those groups.',
    }),
        GroupModule,
        ProjectModule],
    providers: [ListGroupsTool,
        ListProjectsTool,
        GroupStatusTool,
        ProjectStatusTool,
        CreateGroupTool,
        CreateProjectTool,
        DeleteGroupTool,
        DeleteProjectTool],
})
export class BorkedMcpModule { }