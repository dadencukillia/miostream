import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { ListErrors } from "./list.errors";
import * as schemas from "./list.schema";
import * as controllers from "./list.controller";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

type AuthHook = (req: FastifyRequest<any>, reply: FastifyReply<any>) => Promise<void | unknown>;

const requireAuth = grantAuthMiddleware() as AuthHook;

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
	ListErrors.setupErrorHandler(fastify, [ListErrors], true);

	fastify.get("/:userId", { schema: schemas.getListUnitsSchema }, controllers.getListUnits);
	fastify.post("/", { schema: schemas.CreateListUnitSchema, preHandler: requireAuth }, controllers.createListUnit);
	fastify.patch("/:animeId", { schema: schemas.UpdateListUnitSchema, preHandler: requireAuth }, controllers.updateListUnit);
	fastify.delete("/:animeId", { schema: schemas.DeleteListUnitSchema, preHandler: requireAuth }, controllers.deleteListUnit);
};

export default modulePlugin;