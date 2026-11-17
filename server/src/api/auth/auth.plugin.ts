import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as controllers from "./auth.controller";
import { AuthErrors } from "./auth.errors";
import * as schemas from "./auth.schema";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    AuthErrors.setupErrorHandler(fastify, [AuthErrors], true, true);

    fastify.get("/oauth/redirect", { schema: schemas.RedirectToProviderSchema }, controllers.redirectToProvider);
    fastify.post("/oauth/token", { schema: schemas.ExchangeTokenSchema }, controllers.exchangeToken);
};

export default modulePlugin;