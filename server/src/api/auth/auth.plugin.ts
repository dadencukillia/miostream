import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as controllers from "./auth.controller";
import { AuthErrors } from "./auth.errors";
import * as schemas from "./auth.schema";
import { UserErrors } from "@/api/user/user.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    AuthErrors.setupErrorHandler(fastify, [AuthErrors, UserErrors], true, true);

    fastify.get("/oauth/redirect", { schema: schemas.RedirectToProviderSchema }, controllers.redirectToProvider);
    fastify.get("/oauth/callback", { schema: schemas.OAuthCallbackSchema }, controllers.oauthCallback);
    fastify.post("/auth/accessToken", { schema: schemas.AccessTokenSchema }, controllers.accessToken);
};

export default modulePlugin;