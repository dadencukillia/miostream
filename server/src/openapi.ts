import fastifySwagger from "@fastify/swagger";
import Fastify, { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import api from "./api/api.plugin";
import cdn from "./cdn/cdn.plugin";
import scalarPlugin from '@scalar/fastify-api-reference';

/**
 * A Fastify plugin that generates OpenAPI specifications (JSON and YAML formats) for API and CDN modules.
 */
export const openapiJSONPlugin: FastifyPluginAsync = async (fastify, _opts) => {
  const fastifyInstance = Fastify();
  await fastifyInstance.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'MioStream API',
        description: 'Fastify endpoints documentation',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Your current server',
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

  await fastifyInstance.register(api, { prefix: "/api" });
  await fastifyInstance.register(cdn, { prefix: "/cdn" });

  await fastifyInstance.ready();

  fastify.get("/json", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .status(200)
      .header("content-type", "application/json")
      .send(fastifyInstance.swagger({ yaml: false }));
  });

  fastify.get("/yaml", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply
      .status(200)
      .header("content-type", "application/yaml")
      .send(fastifyInstance.swagger({ yaml: true }));
  });
};

/**
 * A Fastify plugin that mounts the Scalar API Reference UI,
 * linking it to the OpenAPI JSON specification endpoint.
 */
export const openapiUIPlugin: FastifyPluginAsync = async (fastify, _opts) => {
  await fastify.register(scalarPlugin, {
    routePrefix: "/scalar",
    configuration: {
      title: 'MioStream API Reference',
      url: "../json",
    },
  });
};
