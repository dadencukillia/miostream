import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import "../../context";

/**
 * Represents the authenticated user's context and session details.
 * Attached to the Fastify request object (`req.auth`) during successful authentication.
 */
export class AuthContext {
  private _sessionId: number;
  private _userId: string;
  private _nickname: string;
  private _fullName: string;
  private _avatarUrl: string;
  private _role: string;
  private _status: string;

  public constructor(sessionId: number, userId: string, nickname: string, fullName: string, avatarUrl: string, role: string, status: string) {
    this._sessionId = sessionId;
    this._userId = userId.trim().toLowerCase();
    this._nickname = nickname.trim();
    this._fullName = fullName.trim();
    this._avatarUrl = avatarUrl.trim();
    this._role = role.trim().toLowerCase();
    this._status = status.trim().toLowerCase();
  }

  public get userId(): string {
    return this._userId;
  }

  public get nickname(): string {
    return this._nickname;
  }

  public get fullName(): string {
    return this._fullName;
  }

  public get avatarUrl(): string {
    return this._avatarUrl;
  }

  public get role(): string {
    return this._role;
  }

  public get status(): string {
    return this._status;
  }

  /**
   * Synchronizes internal class fields (model) with the current database state.
   */
  public syncUser() {
    // TODO: update class fields according
    // to the database's state
  }

  /**
   * Terminates the user session and cleans up authentication cookies/tokens.
   * @param req - The Fastify request object.
   * @param resp - The Fastify reply object.
   */
  public logout(req: FastifyRequest, resp: FastifyReply) {
    // TODO: real session deletion, cookies cleaning
  }
}

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
export async function authMiddleware(req: FastifyRequest, _resp: FastifyReply) {
  // TODO: replace onto the real auth operations
  req.auth = new AuthContext(
    Math.round(Date.now()),
    "00000000-0000-0000-0000-000000000000",
    "exampleUser", "Jack Jackson",
    "https://i.pravatar.cc/256",
    "admin", "active"
  );
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
  fallback?: (req: FastifyRequest, resp: FastifyReply) => void|Promise<void>|FastifyReply|Promise<FastifyReply>,
}

const grantAuthDefaultFilters: Required<GrantAuthFilters> = {
  receiveAuthData: true,
  unsignedOnly: false,
  userHasRole: [],
  userHasStatus: ["active"],
  fallback: (_req, resp) => {
    return resp.status(403).send({ ok: false, message: "no access" });
  }
} as const;

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
export const grantAuthMiddleware = (opts: GrantAuthFilters = grantAuthDefaultFilters) => async (req: FastifyRequest, resp: FastifyReply) => {
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
    await fallback(req, resp);
    if (!resp.sent) {
      grantAuthDefaultFilters.fallback(req, resp);
    }
  };

  if (receiveAuthData) await authMiddleware(req, resp);

  if (unsignedOnly) {
    if (!!req.auth) return await handleFallback();
    return;
  }

  if (!req.auth) return await handleFallback();

  if (userHasRole.length > 0 && !userHasRole.includes(req.auth.role)) {
    return await handleFallback();
  }

  if (userHasStatus.length > 0 && !userHasStatus.includes(req.auth.status)) {
    return await handleFallback();
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
export const authPlugin = (
  fastify: FastifyInstance,
  _opts: {},
  done: () => void
) => {
  fastify.addHook("preHandler", authMiddleware);
  done();
};

/**
 * Fastify plugin that registers conditional route protection via `grantAuthMiddleware`.
 * 
 * @example
 * fastify.register(grantAuthPlugin, { userHasRole: ["admin"] });
 */
export const grantAuthPlugin = (
  fastify: FastifyInstance,
  opts: GrantAuthFilters,
  done: () => void
) => {
  fastify.addHook("preHandler", grantAuthMiddleware(opts));
  done();
};
