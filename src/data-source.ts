import "reflect-metadata";
import { DataSource } from "typeorm";
import * as entities from "./entities";
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from "./config/env";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true,
  logging: false,
  entities: Object.values(entities),
});
