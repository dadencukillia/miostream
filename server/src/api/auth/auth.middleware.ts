import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAuthToken } from "./auth.service";
import { cookieValue } from "../../utils/cookies";
import * as config from "../../config";

export function authMiddleware(request: FastifyRequest, reply: FastifyReply, done: () => void) {
	const token = cookieValue(request, config.AUTH_COOKIE_NAME);
	if (!token) {
		reply.code(401).send({ error: "unauthorized" });
		return;
	}
	const claims = verifyAuthToken(token);
	if (!claims) {
		reply.code(401).send({ error: "unauthorized" });
		return;
	}
	request.user = { id: claims.userId };
	done();
}
