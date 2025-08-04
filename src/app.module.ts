import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';
import { NestModule } from '@nestjs/common';
import { Response, Request } from 'express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupModule } from './groups/group.module';
import { ProjectModule } from './projects/project.module';
import { GithubModule } from './github/github.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(process.cwd(), 'data', 'borkedbot.sqlite'),
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    GroupModule,
    ProjectModule,
    GithubModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next) => {
        if (
          req.method === 'GET' &&
          req.path.startsWith('/app') &&
          !req.path.includes('.')
        ) {
          res.sendFile(join(__dirname, '..', 'public', 'app.html'));
        } else {
          next();
        }
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
