import { Controller, Get, Param, Render, NotFoundException } from '@nestjs/common';
import { ProjectService } from '../projects/project.service';
import { GroupService } from './group.service';
import { OpenPullRequestService } from '../projects/open-pull-request.service';

@Controller('groups')
export class GroupController {
    constructor(private readonly groupService: GroupService,
        private readonly projectService: ProjectService,
        private readonly openPullRequestService: OpenPullRequestService
    ) { }

    @Get()
    @Render('groups_list.hbs')
    async listGroups() {
        const groups = await this.groupService.findAll();
        return { groups };
    }

    @Get(':groupId')
    @Render('group_details.hbs')
    async groupDetails(@Param('groupId') groupId: string) {
        const group = await this.groupService.findByExternalId(groupId);

        if (!group) {
            throw new NotFoundException(`Group with ID '${groupId}' not found`);
        }

        const projects = await this.projectService.findByGroup(group.id);

        projects.sort((a, b) => a.name.localeCompare(b.name));

        const projectStates = await Promise.all(projects.map(async project => ({
            id: project.id,
            externalId: project.externalId,
            url: project.url,
            projectName: project.name,
            defaultBranchName: project.defaultBranchName,
            defaultBranchStatus: project.defaultBranchStatus,
            failingPrCount: project.failingPrs,
            manyFailingPrs: project.failingPrs > 5,
            remainingFailingPrs: Math.max(project.failingPrs - 5, 0),
            lastUpdated: new Date().toISOString().split('T')[0],
            failingPrs: (await this.openPullRequestService.findByProject(project.id)).filter(pr => !pr.allChecksPassed) // Current date as placeholder
        })));

        projectStates.forEach(state => {
            state.failingPrs.sort((a, b) => b.number - a.number);
        });

        return {
            group: { name: group.name },
            projectStates,
        };
    }
}
