import { MIGRATIONS_TABLE, Migrator } from "@utils/migrations";
import { FastifyWebServer } from "./webserver";
import { Command } from 'commander';
import * as config from "@config";
import { Client, Pool } from "pg";
import { formatDate } from "@utils/time";

const program = new Command();

program
  .name("MioStream Backend");

program
  .command("serve")
  .summary("run backend server")
  .description("Scalar endpoint is /openapi/scalar\nJSON specification endpoint is /openapi/json\nYAML specification endpoint is /openapi/yaml\nHealthcheck endpoint is /healthcheck")
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
      const migrator = new Migrator(fastify.pg, config.MIGRATIONS_DIRECTORY)
      await migrator.ensureMigrationsTable();
      await migrator.up();
    }

    await webserver._fastifyRun(fastify);
  });

program
  .command("openapi")
  .summary("run openapi endpoints only")
  .description("Scalar endpoint is /openapi/scalar\nJSON specification endpoint is /openapi/json\nYAML specification endpoint is /openapi/yaml")
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

    await webserver.run();
  });

const migrationCommand = program
  .command("migration")
  .summary("migration operations")

migrationCommand
  .command("up")
  .summary("upgrade database to the latest present migration")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .option("-n, --no-create", "disable auto-creation entries table")
  .option("-d, --directory <path>", "specify migrations directory", config.MIGRATIONS_DIRECTORY)
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
  .option("-d, --directory <path>", "specify migrations directory", config.MIGRATIONS_DIRECTORY)
  .action(async (opts) => {
    const pool = new Pool({ connectionString: config.DB_URL });
    const migrator = new Migrator(pool, opts.directory, opts.schema);
    await migrator.down();
    await pool.end();
  });

migrationCommand
  .command("state")
  .summary("show current database state")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .action(async (opts) => {
    const client = new Client({ connectionString: config.DB_URL });
    await client.connect();
    const migration = await Migrator.getMigration(client, opts.schema, 0);

    if (!migration) {
      console.log("No migrations were made");
      await client.end();
      return;
    }

    const { dateFormat, timeFormat } = formatDate(migration.executedAt);
    console.log(`${migration.state} was migrated on ${dateFormat} at ${timeFormat}`);

    await client.end();
  });

migrationCommand
  .command("log")
  .summary("show database topology change history")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .action(async (opts) => {
    const pool = new Pool({ connectionString: config.DB_URL });
    let skip = 0;

    while(true) {
      const migration = await Migrator.getMigration(pool, opts.schema, skip++);

      if (!migration) {
        break;
      }

      const noFormat = migration.id.toString().padStart(3, '0');
      const { dateFormat, timeFormat } = formatDate(migration.executedAt);

      console.log(`${noFormat}. ${migration.state} (${migration.type}) was migrated on ${dateFormat} at ${timeFormat}`);
    }

    await pool.end();
  });

migrationCommand
  .command("tidy")
  .summary("clear database topology change history leaving the latest entry")
  .option("-s, --schema <string>", "specify database schema for migration entries table", "public")
  .action(async (opts) => {
    const client = new Client({ connectionString: config.DB_URL });
    await client.connect();
    const { rowCount } = await client.query(`DELETE FROM ${opts.schema}.${MIGRATIONS_TABLE} WHERE operation_id NOT IN (SELECT operation_id FROM ${opts.schema}.${MIGRATIONS_TABLE} ORDER BY operation_id DESC LIMIT 1);`);
    await client.end();
    console.log(`Removed ${rowCount} entries`);
  });

await program.parseAsync(process.argv);
