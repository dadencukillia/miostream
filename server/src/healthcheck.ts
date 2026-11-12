import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get('/', {
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
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ health: true });
  });
};

export default plugin;
