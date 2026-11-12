import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { ListError } from "./list.errors";
import * as schemas from "./list.schema";
import * as controllers from "./list.controller";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
	fastify.setErrorHandler((error, request, reply) => {
		if (error instanceof ListError) {
			return reply.status(error.status).send({ ok: false, message: error.message });
		}
		request.log.error(error);
		return reply.status(500).send({ ok: false, message: "unknown error" });
	});

	fastify.post("/", {
		schema: schemas.CreateListUnitSchema,
		preHandler: grantAuthMiddleware() as any,
	}, controllers.createListUnit);

	fastify.patch("/:animeId", {
		schema: schemas.UpdateListUnitSchema,
		preHandler: grantAuthMiddleware() as any,
	}, controllers.updateListUnit);

	fastify.delete("/:animeId", {
		schema: schemas.DeleteListUnitSchema,
		preHandler: grantAuthMiddleware() as any,
	}, controllers.deleteListUnit);
};

export default modulePlugin;