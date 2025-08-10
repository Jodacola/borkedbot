import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GithubService } from './github.service';
import { GithubSyncService } from './github-sync.service';
import { Group } from '../groups/group.entity';
import githubConfig from './github.config';
import { ProjectModule } from '../projects/project.module';
import { Project } from 'src/projects/project.entity';
import { GroupModule } from 'src/groups/group.module';

@Module({
  imports: [
    ConfigModule.forFeature(githubConfig),
    TypeOrmModule.forFeature([Group, Project]),
    GroupModule,
    ProjectModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [GithubService, GithubSyncService],
  exports: [GithubService],
})
export class GithubModule { } 