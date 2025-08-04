import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as hbs from 'hbs';

process.env.TZ = 'UTC';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.NODE_ENV === 'production') {
    app.useStaticAssets(join(__dirname, 'assets'));
    app.setBaseViewsDir(join(__dirname, 'views'));
  } else {
    app.useStaticAssets(join(__dirname, '..', 'src', 'assets'));
    app.setBaseViewsDir(join(__dirname, '..', 'src', 'views'));
  }
  app.setViewEngine('hbs');

  hbs.registerHelper("eachMax", function (context, options) {
    var ret = "";

    const max = options.hash?.max ?? NaN;

    for (var i = 0, j = context.length; i < j; i++) {
      if (!isNaN(max) && i >= max) {
        break;
      }

      ret = ret + options.fn(context[i]);
    }

    return ret;
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
