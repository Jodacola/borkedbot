import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppConfig } from './config.types';
import { GroupService } from '../groups/group.service';
import { ProjectService } from '../projects/project.service';

@Injectable()
export class ConfigService implements OnModuleInit {
  private static instance: ConfigService;
  private config: AppConfig;
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private readonly groupService: GroupService,
    private readonly projectService: ProjectService,
  ) {
    if (ConfigService.instance) {
      return ConfigService.instance;
    }
    ConfigService.instance = this;
  }

  async onModuleInit() {
    await this.loadConfig();
    await this.syncDatabase();
  }

  private async loadConfig(): Promise<void> {
    try {
      const configPath = join(__dirname, '..', '..', 'data', 'projectConfig.json');
      const configData = readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
      this.logger.log('Configuration loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load configuration:', error);
      throw new Error('Failed to load application configuration');
    }
  }

  private async syncDatabase(): Promise<void> {
    try {
      this.logger.log('Starting database synchronization...');
      
      for (const configGroup of this.config.groups) {
        // Create or update group
        const group = await this.groupService.createOrUpdate(
          configGroup.id,
          configGroup.name
        );
        this.logger.log(`Group synchronized: ${group.name} (ID: ${group.id})`);

        // Create or update projects for this group
        for (const configProject of configGroup.projects) {
          const project = await this.projectService.createOrUpdate(
            configProject.id,
            configProject.projectName,
            configProject.githubRepo,
            configProject.url,
            group
          );
          this.logger.log(`Project synchronized: ${project.name} (ID: ${project.id})`);
        }
      }
      
      this.logger.log('Database synchronization completed successfully');
    } catch (error) {
      this.logger.error('Failed to sync database:', error);
      throw new Error('Failed to sync database with configuration');
    }
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Make sure the application has started properly.');
    }
    return this.config;
  }

  getGroups() {
    return this.getConfig().groups;
  }

  getGroupById(id: string) {
    return this.getConfig().groups.find(group => group.id === id);
  }

  getProjectByName(projectName: string) {
    for (const group of this.getConfig().groups) {
      const project = group.projects.find(p => p.projectName === projectName);
      if (project) {
        return { group, project };
      }
    }
    return null;
  }

  getProjectByGithubRepo(githubRepo: string) {
    for (const group of this.getConfig().groups) {
      const project = group.projects.find(p => p.githubRepo === githubRepo);
      if (project) {
        return { group, project };
      }
    }
    return null;
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService(
        new GroupService(null as any),
        new ProjectService(null as any)
      );
    }
    return ConfigService.instance;
  }
} 