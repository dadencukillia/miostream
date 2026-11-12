import { Migrator } from "@utils/migrations";
import { FastifyWebServer } from "./webserver";
import { Command } from 'commander';
import * as config from "@config";
import { Pool } from "pg";

const program = new Command();

program
  .name("MioStream Backend");

program
  .command("serve")
  .summary("run backend server")
  .option("--no-migration", "turn off auto-migration")
  .option("-p, --port <number>", "server listening port", "8080")
  .option("--openapi", "enable endpoint with YAML/JSON OpenAPI specification")
  .option("--scalar", "enable Scalar OpenAPI specification endpoint")
  .option("--no-healthcheck", "disable healthcheck endpoint")
  .action(async (options) => {
    const webserver = new FastifyWebServer({
      modules: [
        "api",
        "cdn",
        options.healthcheck ? "healthcheck" : null,
        options.openapi || options.scalar ? "openapi" : null,
        options.scalar ? "openapiui" : null
      ],
      port: options.port
    });

    const fastify = webserver._pureFastifyInstance();
    await webserver._fastifyRegisterConnections(fastify);
    await webserver._fastifyRegisterModules(fastify);
    
    if (options.migration) {
      const migrator = new Migrator(fastify.pg, "./db/migrations")
      await migrator.ensureMigrationsTable();
      await migrator.up();
    }

    await webserver._fastifyRun(fastify);
  });

program
  .command("openapi")
  .summary("run openapi endpoints only")
  .option("--no-scalar", "disable Scalar OpenAPI specification endpoint")
  .option("-p, --port <number>", "server listening port", "8080")
  .option("--healthcheck", "enable healthcheck endpoint")
  .action(async (options) => {
    const webserver = new FastifyWebServer({
      modules: [
        "openapi",
        options.healthcheck ? "healthcheck" : null,
        options.scalar ? "openapiui" : null
      ],
      port: options.port
    });

    webserver.run();
  });

const migrationCommand = program
  .command("migration")
  .summary("migration operations")

migrationCommand
  .command("up")
  .summary("upgrade database to the latest migration")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .option("-n, --no-create", "disable auto-creation entries table")
  .option("-d, --directory <path>", "specify migrations directory", "./db/migrations")
  .action(async (opts) => {
    const pool = new Pool({ connectionString: config.DB_URL });
    const migrator = new Migrator(pool, opts.directory, opts.schema);

    if (opts.create) {
      await migrator.ensureMigrationsTable();
    }

    await migrator.up();
    await pool.end();
  });

migrationCommand
  .command("down")
  .summary("downgrade database latest migration")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .option("-d, --directory <path>", "specify migrations directory", "./db/migrations")
  .action(async (opts) => {
    const pool = new Pool({ connectionString: config.DB_URL });
    const migrator = new Migrator(pool, opts.directory, opts.schema);
    await migrator.down();
    await pool.end();
  });

program.parse(process.argv);
