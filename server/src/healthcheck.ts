import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ health: true });
  });
};

export default plugin;
