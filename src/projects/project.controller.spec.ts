import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { OpenPullRequestService } from './open-pull-request.service';
import { ProjectSnapshotService } from './project-snapshot.service';

describe('ProjectController', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            findAll: jest.fn(),
            findByExternalId: jest.fn(),
          },
        },
        {
          provide: OpenPullRequestService,
          useValue: {
            findByProject: jest.fn(),
          },
        },
        {
          provide: ProjectSnapshotService,
          useValue: {
            findByProject: jest.fn(),
            findLatestByProject: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
}); 