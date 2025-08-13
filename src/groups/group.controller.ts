import { Controller, Get, Param, Render, NotFoundException, Query } from '@nestjs/common';
import { ProjectService } from '../projects/project.service';
import { GroupService } from './group.service';
import { OpenPullRequestService } from '../projects/open-pull-request.service';
import { GroupSnapshotService } from './group-snapshot.service';

@Controller('groups')
export class GroupController {
    constructor(private readonly groupService: GroupService,
        private readonly projectService: ProjectService,
        private readonly openPullRequestService: OpenPullRequestService,
        private readonly groupSnapshotService: GroupSnapshotService
    ) { }

    @Get()
    @Render('groups_list.hbs')
    async listGroups() {
        const groups = await this.groupService.findAll();
        return { groups };
    }

    @Get(':groupId')
    @Render('group_details.hbs')
    async groupDetails(
        @Param('groupId') groupId: string,
        @Query('page') page?: string,
        @Query('refresh') refresh?: string) {
        const group = await this.groupService.findByExternalId(groupId);

        if (!group) {
            throw new NotFoundException(`Group with ID '${groupId}' not found`);
        }

        let pageNumber = page ? parseInt(page) : 1;
        if (isNaN(pageNumber)) {
            pageNumber = 1;
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
            failingPrs: (await this.openPullRequestService.findByProject(project.id)).filter(pr => !pr.allChecksPassed)
        })));

        const projectsWithFailingPrs = projectStates.filter(state => state.failingPrs.length > 0);

        projectStates.forEach(state => {
            state.failingPrs.sort((a, b) => b.number - a.number);
        });

        const paginatedSnapshots = await this.groupSnapshotService.findPaginatedByGroup(group.id, pageNumber);

        return {
            group,
            projectStates,
            snapshots: paginatedSnapshots,
            hasOlderSnapshots: paginatedSnapshots.page < paginatedSnapshots.totalPages,
            olderSnapshotsPage: paginatedSnapshots.page + 1,
            hasNewerSnapshots: paginatedSnapshots.page > 1,
            newerSnapshotsPage: paginatedSnapshots.page - 1,
            hasAnyOlderOrNewerSnapshots: paginatedSnapshots.page < paginatedSnapshots.totalPages || paginatedSnapshots.page > 1,
            hasSnapshots: paginatedSnapshots.snapshots.length > 0,
            hasFailingPrs: projectsWithFailingPrs.length > 0,
            projectsWithFailingPrs,
            autoRefresh: refresh === 'true'
        };
    }
}
