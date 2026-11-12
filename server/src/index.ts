import { Migrator } from "@utils/migrations";
import { FastifyWebServer } from "./webserver";
import { Command } from 'commander';

const program = new Command();

program
  .name("MioStream Backend");

program
  .command("serve")
  .description("run backend server")
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

program.parse(process.argv);
