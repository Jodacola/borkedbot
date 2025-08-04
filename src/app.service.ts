import { Injectable, Render } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return { currentDate: new Date().toISOString(), message: 'Hello World!' };
  }
}
