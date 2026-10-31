import Fastify from "fastify";
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import connector from "./utils/connector";
import { S3Connection } from "./connections/s3";
import api from "./api/plugin";
import cdn from "./cdn/plugin";
import { PostgresConnection } from "./connections/pg";

const fastify = Fastify({
  logger: true,
  pluginTimeout: 0,
  ajv: {
    customOptions: {
      unicodeRegExp: true,
      removeAdditional: false,
    }
  },
});

await fastify.register(connector, {
  retries: 3,
  interval: 15 * 1000, // 15 seconds
  connections: [
    S3Connection,
    PostgresConnection,
  ],
});

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'MioStream API',
      description: 'Fastify endpoints documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        apiKeyAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  },
});

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

fastify.get('/healthcheck', {
  schema: {
    tags: ['System'],
    summary: 'Health status',
    response: {
      200: {
        type: 'object',
        properties: { health: { type: 'boolean' } },
      },
    },
  },
}, async (_request, reply) => {
  return reply.send({ health: true });
});

await fastify.register(api, { prefix: "/api" });
await fastify.register(cdn, { prefix: "/cdn" });

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

const shutdown = async () => {
  fastify.log.info('Stopping server...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
