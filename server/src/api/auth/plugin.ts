import type { FastifyPluginCallback } from "fastify";
import { finishGoogleLogin, getCurrentUser, logout, startGoogleLogin } from "./controller";
import { requireAuth } from "./middleware";

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
	fastify.get("/google", startGoogleLogin);
	fastify.get("/google/callback", finishGoogleLogin);
	fastify.post("/logout", logout);
	fastify.get("/me", { preHandler: requireAuth }, getCurrentUser);

	done();
};

export default plugin;
