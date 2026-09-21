import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import * as config from "../../config";
import { exchangeGoogleCode, googleLoginUrl, handleGoogleUser } from "./auth.service";
import { cookieValue } from "../../utils/cookies";

export const redirectGoogleFormController = async (_request: FastifyRequest, reply: FastifyReply) => {
  if (!config.GOOGLE_CLIENT_ID) return reply.code(503).send({ error: "Google OAuth is not configured" });
  const state = randomBytes(24).toString("base64url");
  reply.header("Set-Cookie", `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=600`);
  return reply.redirect(googleLoginUrl(state));
}

export const googleCallbackController = async (
  request: FastifyRequest<{ Querystring: { code?: string; state?: string } }>,
  reply: FastifyReply
) => {
  const stateCookie = cookieValue(request, "oauth_state");
  const stateMatches = stateCookie && request.query.state && stateCookie.length === request.query.state.length && timingSafeEqual(Buffer.from(stateCookie), Buffer.from(request.query.state));

  if (!request.query.code || !stateMatches) return reply.code(400).send({ error: "Invalid OAuth callback" });
  const profile = await exchangeGoogleCode(request.query.code);
  const { token } = await handleGoogleUser({ email: profile.email!, name: profile.name, refreshToken: profile.refreshToken });
  reply.header("Set-Cookie", `${config.AUTH_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000; Secure`);
  return reply.redirect("/");
}

export const logoutController = async (_request: FastifyRequest, reply: FastifyReply) => {
  reply.header("Set-Cookie", `${config.AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return reply.code(204).send();
}

export const getAuthUserController = async (request: FastifyRequest) => ({ userId: request.user?.id });
