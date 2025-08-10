import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './group.entity';
import { ProjectModule } from '../projects/project.module';
import { GroupSnapshot } from './group-snapshot.entity';
import { GroupSnapshotService } from './group-snapshot.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group]), TypeOrmModule.forFeature([GroupSnapshot]), ProjectModule],
  controllers: [GroupController],
  providers: [GroupService, GroupSnapshotService],
  exports: [GroupService, GroupSnapshotService],
})
export class GroupModule { }
