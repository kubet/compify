import { config as loadEnvironment } from 'dotenv';
import { DataSource } from 'typeorm';

const stage = process.env.STAGE;
if (stage) loadEnvironment({ path: `.env.stage.${stage}` });
loadEnvironment({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: [`${__dirname}/entities/**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
