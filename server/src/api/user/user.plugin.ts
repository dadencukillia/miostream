import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import * as schemas from "./user.schema";
import * as controllers from "./user.controller";
import { UserErrors, AvatarErrors } from "./user.errors";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";
import { AuthErrors } from "@/api/auth/auth.errors";

const requireAdmin = grantAuthMiddleware({ userHasRole: ["admin"] });
const requireAuth = grantAuthMiddleware();

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    UserErrors.setupErrorHandler(fastify, [UserErrors, AvatarErrors, AuthErrors], true, true);

    // Public routes
    fastify.post("/", { schema: schemas.CreateUserSchema }, controllers.createUser);
    fastify.get("/:identifier", { schema: schemas.GetUserSchema }, controllers.getUser);
    fastify.get("/:userId/links", { schema: schemas.ListUserLinksByUserIdSchema }, controllers.listUserLinksByUserId);

    // Authenticated user routes
    fastify.get("/me", { schema: schemas.GetMeUserSchema, preHandler: requireAuth }, controllers.getMe);
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
