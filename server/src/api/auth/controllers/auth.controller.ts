import type { FastifyPluginCallback, FastifyRequest } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { AUTH_COOKIE_NAME, GOOGLE_CLIENT_ID } from "../config/config";
import { createSession, exchangeGoogleCode, getSession, googleLoginUrl } from "../services/auth.service";

declare module "fastify" {

	interface FastifyRequest {
		user?: { id: number };
	}
}

function cookieValue(request: FastifyRequest, name: string) {
	return request.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function requireAuth(request: FastifyRequest, reply: { code: (status: number) => { send: (body: unknown) => void } }) {
	const sessionId = cookieValue(request, AUTH_COOKIE_NAME);
	if (!sessionId) return reply.code(401).send({ error: "unauthorized" });
	const session = await getSession(sessionId);
	if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return reply.code(401).send({ error: "unauthorized" });
	request.user = { id: session.userId };
}

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
	fastify.get("/google", async (_request, reply) => {
		if (!GOOGLE_CLIENT_ID) return reply.code(503).send({ error: "Google OAuth is not configured" });
		const state = randomBytes(24).toString("base64url");
		reply.header("Set-Cookie", `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=600`);
		return reply.redirect(googleLoginUrl(state));
	});

	fastify.get<{ Querystring: { code?: string; state?: string } }>("/google/callback", async (request, reply) => {
		const stateCookie = cookieValue(request, "oauth_state");
		const stateMatches = stateCookie && request.query.state && stateCookie.length === request.query.state.length && timingSafeEqual(Buffer.from(stateCookie), Buffer.from(request.query.state));
		if (!request.query.code || !stateMatches) return reply.code(400).send({ error: "Invalid OAuth callback" });
		const profile = await exchangeGoogleCode(request.query.code);
		const { sessionId } = await createSession({ email: profile.email!, name: profile.name, refreshToken: profile.refreshToken, expiresIn: profile.expiresIn });
		reply.header("Set-Cookie", `${AUTH_COOKIE_NAME}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${process.env["NODE_ENV"] === "production" ? "; Secure" : ""}`);
		return reply.redirect("/");
	});

	fastify.post("/logout", async (_request, reply) => {
		reply.header("Set-Cookie", `${AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
		return reply.code(204).send();
	});

	fastify.get("/me", { preHandler: requireAuth }, async (request) => ({ userId: request.user?.id }));
	done();
};

export default plugin;
