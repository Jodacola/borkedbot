# Configuration System

This module provides a global configuration system that reads a JSON configuration file at application startup and makes it available throughout the application. It also automatically synchronizes the database with the configuration data.

## Configuration File Format

The configuration is stored in `data/projectConfig.json` with the following structure:

```json
{
  "groups": [
    {
      "id": "group-id",
      "name": "Group Display Name",
      "projects": [
        {
          "id": "project-id",
          "projectName": "Project Display Name",
          "githubRepo": "org/repoName",
          "url": "https://github.com/org/repoName"
        }
      ]
    }
  ]
}
```

## Database Synchronization

When the application starts, the ConfigService automatically:

1. **Reads the configuration file** from `data/projectConfig.json`
2. **Synchronizes the database** by creating or updating:
   - **Groups**: Uses the `id` field as `externalId` in the database
   - **Projects**: Uses the `projectName` field as `externalId` in the database
3. **Maintains relationships** between groups and projects
4. **Generates URLs** automatically from GitHub repository names

### Synchronization Process

- **Groups**: If a group with the same `externalId` exists, it updates the name. Otherwise, it creates a new group.
- **Projects**: If a project with the same `externalId` exists, it updates the name, GitHub repo, and group association. Otherwise, it creates a new project.
- **Logging**: All synchronization activities are logged using NestJS Logger.

## Usage

### 1. Inject ConfigService in your service/controller

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}

  someMethod() {
    // Get all configuration
    const config = this.configService.getConfig();
    
    // Get all groups
    const groups = this.configService.getGroups();
    
    // Find a specific group
    const group = this.configService.getGroupById('some-group-id');
    
    // Find a project by name
    const projectData = this.configService.getProjectByName('project-name');
    
    // Find a project by GitHub repository
    const projectData = this.configService.getProjectByGithubRepo('org/repo');
  }
}
```

### 2. Access the singleton instance directly (if needed)

```typescript
import { ConfigService } from '../config/config.service';

const configService = ConfigService.getInstance();
const config = configService.getConfig();
```

## Available Methods

- `getConfig()`: Returns the complete configuration object
- `getGroups()`: Returns all groups
- `getGroupById(id: string)`: Finds a group by its ID
- `getProjectByName(projectName: string)`: Finds a project by name, returns `{ group, project }`
- `getProjectByGithubRepo(githubRepo: string)`: Finds a project by GitHub repository, returns `{ group, project }`
- `getInstance()`: Static method to get the singleton instance

## Database Services

The configuration system also provides database services for direct database operations:

### GroupService
- `findByExternalId(externalId: string)`: Find a group by external ID
- `createOrUpdate(externalId: string, name: string)`: Create or update a group
- `findAll()`: Get all groups with their projects

### ProjectService
- `findByExternalId(externalId: string)`: Find a project by external ID
- `createOrUpdate(externalId: string, name: string, githubRepo: string, group: Group)`: Create or update a project
- `findAll()`: Get all projects with their groups
- `findByGroup(groupId: number)`: Get all projects for a specific group

## Error Handling

The configuration service will throw an error if:
- The configuration file cannot be read
- The JSON is malformed
- The database synchronization fails
- The configuration is accessed before the application has fully started

## Global Availability

The ConfigService is registered as a global provider, so it can be injected into any service or controller without needing to import the ConfigModule in each module. 