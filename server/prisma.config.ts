import "dotenv/config";
import { defineConfig } from "prisma/config";
import { DB_URL } from "./src/config";

export default defineConfig({
  schema: "./src/prisma/",
  typedSql: {
    path: "./src/prisma/sql",
  },
  migrations: {
    path: "./src/prisma/migrations",
  },
  datasource: {
    url: DB_URL,
  },
});
