import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { ListErrors } from "./list.errors";
import * as schemas from "./list.schema";
import * as controllers from "./list.controller";
import { grantAuthMiddleware } from "../auth/auth.middleware";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
	ListErrors.setupErrorHandler(fastify, [ListErrors], true, true);

	fastify.get("/:userId", { schema: schemas.getListUnitsSchema }, controllers.getListUnits);
	fastify.post("/", { schema: schemas.CreateListUnitSchema, preHandler: grantAuthMiddleware() }, controllers.createListUnit);
	fastify.patch("/:animeId", { schema: schemas.UpdateListUnitSchema, preHandler: grantAuthMiddleware() }, controllers.updateListUnit);
	fastify.delete("/:animeId", { schema: schemas.DeleteListUnitSchema, preHandler: grantAuthMiddleware() }, controllers.deleteListUnit);
};

export default modulePlugin;
