import type { FastifyPluginCallback } from "fastify";
import { getAuthUserController, googleCallbackController, logoutController, redirectGoogleFormController } from "./auth.controller";
import { authMiddleware } from "./auth.middleware";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
	fastify.get("/google", redirectGoogleFormController);
	fastify.get("/google/callback", googleCallbackController);
	fastify.post("/logout", logoutController);
	fastify.get("/me", { preHandler: authMiddleware }, getAuthUserController);

	done();
};

export default plugin;
