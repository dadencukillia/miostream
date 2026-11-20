import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as controllers from "./auth.controller";
import { AuthErrors } from "./auth.errors";
import * as schemas from "./auth.schema";
import { UserErrors } from "@/api/user/user.errors";
import { authMiddleware } from "./auth.middleware";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    AuthErrors.setupErrorHandler(fastify, [AuthErrors, UserErrors], true, true);

    fastify.get("/redirect", { schema: schemas.RedirectToProviderSchema }, controllers.redirectToProvider);
    fastify.get("/callback", { schema: schemas.OAuthCallbackSchema }, controllers.oauthCallback);
    fastify.get("/accessToken", { schema: schemas.AccessTokenSchema }, controllers.accessToken);
    fastify.get("/logout", { schema: schemas.LogoutSchema, preHandler: authMiddleware }, controllers.logout);
};

export default modulePlugin;
