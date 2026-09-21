import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import * as config from "../../config";
import { getGoogleAuthUrl, getGoogleProfile, saveGoogleUser } from "./service";
import { cookieValue } from "../../utils/cookies";

export const startGoogleLogin = async (_request: FastifyRequest, reply: FastifyReply) => {
  if (!config.GOOGLE_CLIENT_ID) return reply.code(503).send({ error: "Google OAuth is not configured" });
  const state = randomBytes(24).toString("base64url");

  // State cookie returns with the callback and protects the OAuth flow.
  reply.header("Set-Cookie", `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=600`);
  return reply.redirect(getGoogleAuthUrl(state));
}

export const finishGoogleLogin = async (
  request: FastifyRequest<{ Querystring: { 
  code?: string;
  state?: string 
  } }>,
  reply: FastifyReply
) => {
  const stateCookie = cookieValue(request, "oauth_state");
  const stateMatches = stateCookie && request.query.state && stateCookie.length === request.query.state.length && timingSafeEqual(Buffer.from(stateCookie), Buffer.from(request.query.state));

  if (!request.query.code || !stateMatches) return reply.code(400).send({ error: "Invalid OAuth callback" });
  const profile = await getGoogleProfile(request.query.code);
  const { token } = await saveGoogleUser({ 
    email: profile.email!,
    name: profile.name,
    refreshToken: profile.refreshToken });

  // The app token goes to an HttpOnly cookie; browser JavaScript cannot read it.
  reply.header("Set-Cookie", `${config.AUTH_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000; Secure`);
  return reply.redirect("/");
}

export const logout = async (_request: FastifyRequest, reply: FastifyReply) => {
  // Expiring the cookie removes the app session from the browser.
  reply.header("Set-Cookie", `${config.AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return reply.code(204).send();
}

export const getCurrentUser = async (request: FastifyRequest) => ({ userId: request.user?.id });
