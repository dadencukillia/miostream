import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import * as schemas from "./user.schema";
import * as controllers from "./user.controller";
import { UserErrors, AvatarErrors } from "./user.errors";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

type AuthHook = (req: FastifyRequest<any>, reply: FastifyReply<any>) => Promise<void | unknown>;

const requireAdmin = grantAuthMiddleware({ userHasRole: ["admin"] }) as AuthHook;
const requireAuth = grantAuthMiddleware() as AuthHook;

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    UserErrors.setupErrorHandler(fastify, [UserErrors, AvatarErrors]);

    // Public routes
    fastify.post("/", { schema: schemas.CreateUserSchema }, controllers.createUser);
    fastify.get("/:identifier", { schema: schemas.GetUserSchema }, controllers.getUser);
    fastify.get("/:userId/links", { schema: schemas.ListUserLinksByUserIdSchema }, controllers.listUserLinksByUserId);
    
    // Authenticated user routes
    fastify.patch("/profile", { schema: schemas.UpdateUserProfileSchema, preHandler: requireAuth }, controllers.updateUserProfile);
    fastify.put("/avatar", { schema: schemas.UpdateUserAvatarSchema, preHandler: requireAuth }, controllers.updateUserAvatar);
    fastify.delete("/avatar", { schema: schemas.DeleteUserAvatarSchema, preHandler: requireAuth }, controllers.deleteUserAvatar);
    fastify.patch("/customization", { schema: schemas.UpdateUserCustomizationSchema, preHandler: requireAuth }, controllers.updateUserCustomization);
    fastify.patch("/password", { schema: schemas.UpdateUserPasswordSchema, preHandler: requireAuth }, controllers.updateUserPassword);
    fastify.delete("/", { schema: schemas.DeleteUserSchema, preHandler: requireAuth }, controllers.deleteUser);

    // Authenticated user links routes
    fastify.post("/links", { schema: schemas.CreateUserLinkSchema, preHandler: requireAuth }, controllers.createUserLink);
    fastify.get("/links", { schema: schemas.ListUserLinksSchema, preHandler: requireAuth }, controllers.listUserLinks);
    fastify.put("/links/:userLinkId", { schema: schemas.UpdateUserLinkSchema, preHandler: requireAuth }, controllers.updateUserLink);
    fastify.delete("/links/:userLinkId", { schema: schemas.DeleteUserLinkSchema, preHandler: requireAuth }, controllers.deleteUserLink);

    // Admin routes
    fastify.patch("/:userId/status", { schema: schemas.UpdateUserStatusSchema, preHandler: requireAdmin }, controllers.updateUserStatus);
    fastify.patch("/:userId/role", { schema: schemas.UpdateUserRoleSchema, preHandler: requireAdmin }, controllers.updateUserRole);
    fastify.delete("/:userId", { schema: schemas.DeleteUserByIdSchema, preHandler: requireAdmin }, controllers.deleteUserById);
};

export default modulePlugin;
