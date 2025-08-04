import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(process.cwd(), 'data', 'borkedbot.sqlite'),
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
  logging: false,
});
