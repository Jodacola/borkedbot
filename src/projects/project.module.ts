import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { OpenPullRequestService } from './open-pull-request.service';
import { ProjectSnapshotService } from './project-snapshot.service';
import { Project } from './project.entity';
import { OpenPullRequest } from './open-pull-request.entity';
import { ProjectSnapshot } from './project-snapshot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, OpenPullRequest, ProjectSnapshot])],
  controllers: [ProjectController],
  providers: [ProjectService, OpenPullRequestService, ProjectSnapshotService],
  exports: [ProjectService, OpenPullRequestService, ProjectSnapshotService],
})
export class ProjectModule {} 