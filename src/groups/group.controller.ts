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

        let pageNumber = page ? parseInt(page) : 1;
        if (isNaN(pageNumber)) {
            pageNumber = 1;
        }

        const { group, projects, snapshots } = await this.groupService.findGroupWithProjectInfo(groupId, pageNumber);

        const viewProjects = projects.map(p => ({
            ...p,
            prs: undefined,
            failingPrCount: p.failingPrs,
            manyFailingPrs: p.failingPrs > 5,
            remainingFailingPrs: Math.max(p.failingPrs - 5, 0),
            failingPrs: p.prs.filter(pr => !pr.allChecksPassed)
        }));

        const projectsWithFailingPrs = viewProjects.filter(state => state.failingPrs.length > 0);

        return {
            group,
            projects: viewProjects,
            snapshots,
            hasOlderSnapshots: snapshots.page < snapshots.totalPages,
            olderSnapshotsPage: snapshots.page + 1,
            hasNewerSnapshots: snapshots.page > 1,
            newerSnapshotsPage: snapshots.page - 1,
            hasAnyOlderOrNewerSnapshots: snapshots.page < snapshots.totalPages || snapshots.page > 1,
            hasSnapshots: snapshots.snapshots.length > 0,
            hasFailingPrs: projectsWithFailingPrs.length > 0,
            projectsWithFailingPrs,
            autoRefresh: refresh === 'true'
        };
    }
}
