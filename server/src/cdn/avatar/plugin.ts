import type { FastifyInstance } from "fastify";
import { getSchema, resetSchema, updateSchema } from "./schemas";
import { getAvatarController } from "./controllers/get.controller";
import { updateAvatarController } from "./controllers/update.controller";
import { resetAvatarController } from "./controllers/reset.controller";

export default function(fastify: FastifyInstance, _opts: {}, done: () => void) {
  fastify.get('/:imageSlug(^[a-zA-Z0-9]+).webp', { schema: getSchema }, getAvatarController);

  // TODO: wrap auth middleware, move to /api/user
  fastify.put('/', { schema: updateSchema }, updateAvatarController);

  // TODO: wrap auth middleware, move to /api/user
  fastify.delete('/', { schema: resetSchema }, resetAvatarController);

  done();
}
