import { Controller, Get, Param, NotFoundException, Render, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { OpenPullRequestService } from './open-pull-request.service';
import { ProjectSnapshotService } from './project-snapshot.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly openPullRequestService: OpenPullRequestService,
    private readonly projectSnapshotService: ProjectSnapshotService,
  ) { }

  @Get(':externalId')
  @Render('project_details.hbs')
  async getProjectByExternalId(
    @Param('externalId') externalId: string,
    @Query('page') page?: string
  ) {
    const project = await this.projectService.findByExternalId(externalId);

    if (!project) {
      throw new NotFoundException(`Project with external ID '${externalId}' not found`);
    }

    let pageNumber = page ? parseInt(page) : 1;
    if (isNaN(pageNumber)) {
      pageNumber = 1;
    }

    const failingPrs = (await this.openPullRequestService.findByProject(project.id)).filter(pr => !pr.allChecksPassed);
    failingPrs.sort((a, b) => b.number - a.number);
    const paginatedSnapshots = await this.projectSnapshotService.findPaginatedByProject(project.id, pageNumber);

    return {
      project,
      failingPrs,
      snapshots: paginatedSnapshots,
      hasOlderSnapshots: paginatedSnapshots.page < paginatedSnapshots.totalPages,
      olderSnapshotsPage: paginatedSnapshots.page + 1,
      hasNewerSnapshots: paginatedSnapshots.page > 1,
      newerSnapshotsPage: paginatedSnapshots.page - 1,
      hasAnyOlderOrNewerSnapshots: paginatedSnapshots.page < paginatedSnapshots.totalPages || paginatedSnapshots.page > 1,
      hasFailingPrs: failingPrs.length > 0,
      hasSnapshots: paginatedSnapshots.snapshots.length > 0
    };
  }
} 