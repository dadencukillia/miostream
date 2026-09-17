import type { FastifyReply, FastifyRequest } from "fastify";

export const updateAvatarController = (request: FastifyRequest, reply: FastifyReply) => {
  reply.send({ hello: 'world' });
};
