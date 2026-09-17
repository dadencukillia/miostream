import type { FastifyReply, FastifyRequest } from "fastify";

export const resetAvatarController = (request: FastifyRequest, reply: FastifyReply) => {
  reply.send({ hello: 'world' });
};
