import type { FastifyReply, FastifyRequest } from "fastify";

export const getAvatarController = (request: FastifyRequest, reply: FastifyReply) => {
  reply.send({ hello: 'world' });
};
