import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { GroupModule } from '../groups/group.module';
import { ProjectModule } from '../projects/project.module';

@Global()
@Module({
  imports: [GroupModule, ProjectModule],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {} 