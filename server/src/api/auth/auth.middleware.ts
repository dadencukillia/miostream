import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest, preHandlerAsyncHookHandler, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerDefault } from "fastify";
import "@context";
import fp from "fastify-plugin";
import { deleteSessionById, getSessionById, GetSessionByIdRow } from "@sqlc/sessions_sql";
import { AuthErrors } from "./auth.errors";
import { setCookie } from "@utils/cookies";
import { getUserById, GetUserByIdRow } from "@sqlc/users_sql";
import { Client, Pool } from "pg";
import { validateAccessToken } from "./auth.service";

/**
 * Represents the authenticated user's context and session details.
 * Attached to the Fastify request object (`req.auth`) during successful authentication.
 */
export class AuthContext {
  private _sessionId: bigint;
  private _userId: string;
  private _user: Promise<GetUserByIdRow|null>|null = null;
  private _session: Promise<GetSessionByIdRow|null>|null = null;

  public constructor(sessionId: bigint, userId: string) {
    this._sessionId = sessionId;
    this._userId = userId.trim().toLowerCase();
  }

  /**
   * Receives user information from database.
   */
  public async getUser(pg: Client|Pool): Promise<GetUserByIdRow|null> {
    if (!this._user) {
      this._user = getUserById(pg, { userId: this._userId });
    }

    return this._user;
  }

  /**
   * Receives session information from database.
   */
  public async getSession(pg: Client|Pool): Promise<GetSessionByIdRow|null> {
    if (!this._session) {
      this._session = getSessionById(pg, { sessionId: this._sessionId.toString() });
    }

    return this._session;
  }

  public get sessionId(): bigint {
    return this._sessionId;
  }

  public get userId(): string {
    return this._userId;
  }

  /**
   * Terminates the user session and cleans up authentication cookies/tokens.
   * @param req - The Fastify request object.
   * @param resp - The Fastify reply object.
   */
  public async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      await deleteSessionById(request.server.pg, { sessionId: this._sessionId.toString() });
    } catch {
      throw AuthErrors.error("auth-db-failed");
    }

    setCookie(reply, "session_token", "", { maxAge: 0 });
  }
}

type AnyRoutePreHandler = preHandlerAsyncHookHandler<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  any
>;

/**
 * Fastify preHandler middleware that populates `req.auth` with a `AuthContext`.
 * 
 * @remarks
 * authMiddleware doesn't ensure that user will be authenticated. Use `grantAuthMiddleware` instead for this.
 *
 * @example
 * ```typescript
 * fastify.get("/endpoint", { preHandler: authMiddleware }, (req, rep) => {
 *  // Note: req.auth could be null if the user is not authenticated
 * 
 *  return rep.status(200).send(`Greetings, ${req.auth.nickname}`);
 * });
 * ```
 */
export const authMiddleware: AnyRoutePreHandler = async (request: FastifyRequest, _reply: FastifyReply) => {
  // TODO: replace onto the real auth operations

  const authHeader = request.headers.authorization?.trim();

  if (!authHeader?.startsWith("Bearer ")) {
    return;
  }

  const split = authHeader.split(" ");
  const token = split[split.length - 1];

  if (!token) return;

  const accessTokenPayload = await validateAccessToken(token);
  request.auth = new AuthContext(BigInt(accessTokenPayload.sessionId), accessTokenPayload.sub);
}

/**
 * Configuration options for filtering and securing routes using `grantAuthMiddleware`.
 *
 * @remarks
 * if there a `authPlugin` or a `authMiddleware` is set before this middleware/middleware, set `receiveAuthData` to **false** for optimizations purpose.
 */
export interface GrantAuthFilters {
  /** Whether to automatically attempt loading auth data using `authMiddleware`. Default is `true`. */
  receiveAuthData?: boolean,
  /** If `true`, requires the user to be unauthenticated (guest only). Default is `false`. */
  unsignedOnly?: boolean,
  /** Restricts access to users holding one of these specific roles. */
  userHasRole?: string[],
  /** Restricts access to users having one of these account statuses. Default is `["active"]`. */
  userHasStatus?: string[],
  /** Custom callback executed when validation checks fail. */
  fallback?: (request: FastifyRequest, reply: FastifyReply) => void | Promise<void>,
}

const grantAuthDefaultFilters: Required<GrantAuthFilters> = {
  receiveAuthData: true,
  unsignedOnly: false,
  userHasRole: [],
  userHasStatus: ["active"],
  fallback: (_req, resp) => {
    resp.status(403).send({ ok: false, message: "no access", error: "no-access" });
  }
};

/**
 * Creates a customizable route middleware generator to enforce fine-grained authentication and authorization filters.
 * 
 * @param opts - Filtering options like required roles, statuses, or guest-only constraints.
 * @returns A Fastify preHandler middleware function.
 * 
 * @example
 * // Require an active user with an "admin" role
 * fastify.get('/admin-panel', {
 *   preHandler: grantAuthMiddleware({ userHasRole: ['admin'] })
 * }, async (req, reply) => {
 *   return { message: `Welcome ${req.auth!.fullName}` };
 * });
 */
export const grantAuthMiddleware = (opts: GrantAuthFilters = grantAuthDefaultFilters): AnyRoutePreHandler => async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const {
    receiveAuthData, unsignedOnly, userHasRole, userHasStatus, fallback
  } = {
    ...grantAuthDefaultFilters, ...opts,
    receiveAuthData: opts.receiveAuthData ?? grantAuthDefaultFilters.receiveAuthData,
    unsignedOnly: opts.unsignedOnly ?? grantAuthDefaultFilters.unsignedOnly,
    userHasRole: opts.userHasRole ?? grantAuthDefaultFilters.userHasRole,
    userHasStatus: opts.userHasStatus ?? grantAuthDefaultFilters.userHasStatus,
    fallback: opts.fallback ?? grantAuthDefaultFilters.fallback,
  };

  const handleFallback = async () => {
    const result: unknown = fallback(request, reply);
    if (result !== reply) await result;

    if (!reply.sent) {
      grantAuthDefaultFilters.fallback(request, reply);
    }
  };

  if (receiveAuthData) await authMiddleware.call(this, request, reply);

  if (unsignedOnly) {
    if (request.auth != null) await handleFallback();
    return;
  }

  if (!request.auth) {
    return await handleFallback();
  }

  if (userHasRole.length > 0) {
    const user = await request.auth.getUser(request.server.pg);
    if (!user || !userHasRole.includes(user.userRole)) return await handleFallback();
  }

  if (userHasStatus.length > 0) {
    const user = await request.auth.getUser(request.server.pg);
    if (!user || !userHasStatus.includes(user.userStatus)) return await handleFallback();
  }
};

/**
 * Fastify plugin that globally or locally registers `authMiddleware` via a `preHandler` hook.
 * 
 * @remarks
 * authPlugin doesn't ensure that user will be authenticated. Use `grantAuthPlugin` instead for this.
 *
 * @example
 * fastify.register(authPlugin);
 */
export const authPlugin = fp((
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.addHook("preHandler", authMiddleware);
  done();
});

/**
 * Fastify plugin that registers conditional route protection via `grantAuthMiddleware`.
 * 
 * @example
 * fastify.register(grantAuthPlugin, { userHasRole: ["admin"] });
 */
export const grantAuthPlugin = fp((
  fastify: FastifyInstance,
  opts: GrantAuthFilters,
  done: () => void
) => {
  fastify.addHook("preHandler", grantAuthMiddleware(opts));
  done();
});
