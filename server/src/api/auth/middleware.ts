import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "./service";
import { cookieValue } from "../../utils/cookies";
import * as config from "../../config";

export function requireAuth(request: FastifyRequest, reply: FastifyReply, done: () => void) {
	const token = cookieValue(request, config.AUTH_COOKIE_NAME);
	if (!token) {
		reply.code(401).send({ error: "unauthorized" });
		return;
	}
	// The cookie token is verified before its user id is trusted.
	const claims = verifyToken(token);
	if (!claims) {
		reply.code(401).send({ error: "unauthorized" });
		return;
	}
	request.user = { id: claims.userId };
	done();
}
