import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load configuration on module init', async () => {
    await service.onModuleInit();
    const config = service.getConfig();
    expect(config).toBeDefined();
    expect(config.groups).toBeDefined();
    expect(Array.isArray(config.groups)).toBe(true);
  });

  it('should return singleton instance', () => {
    const instance1 = ConfigService.getInstance();
    const instance2 = ConfigService.getInstance();
    expect(instance1).toBe(instance2);
  });
}); 