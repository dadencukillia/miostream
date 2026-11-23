import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as controllers from "./auth.controller";
import { AuthErrors } from "./auth.errors";
import { grantAuthMiddleware } from "./auth.middleware";
import * as schemas from "./auth.schema";
import { UserErrors } from "@/api/user/user.errors";

const requireAuth = grantAuthMiddleware();

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    AuthErrors.setupErrorHandler(fastify, [AuthErrors, UserErrors], true, true);

    fastify.post("/register", { schema: schemas.RegisterSchema }, controllers.register);
    fastify.post("/login", { schema: schemas.LoginSchema }, controllers.login);
    fastify.patch("/password", { schema: schemas.UpdatePasswordSchema, preHandler: requireAuth }, controllers.updatePassword);
    fastify.get("/redirect", { schema: schemas.RedirectToProviderSchema }, controllers.redirectToProvider);
    fastify.get("/callback", { schema: schemas.OAuthCallbackSchema }, controllers.oauthCallback);
    fastify.get("/session/token", { schema: schemas.AccessTokenSchema }, controllers.accessToken);
    fastify.get("/session/logout", { schema: schemas.LogoutSchema }, controllers.logout);
};

export default modulePlugin;
