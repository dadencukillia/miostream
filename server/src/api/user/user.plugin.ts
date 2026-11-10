import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import * as schemas from './user.schema';
import * as controllers from './user.controller';
import { UserErrors, AvatarErrors } from './user.errors';
import { grantAuthMiddleware } from '@/api/auth/auth.middleware';

type AuthHook = (req: FastifyRequest<any>, reply: FastifyReply<any>) => Promise<void | unknown>;

const requireAdmin = grantAuthMiddleware({ userHasRole: ['admin'] }) as AuthHook;
const requireAuth = grantAuthMiddleware() as AuthHook;

const verifySelf: AuthHook = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    if (req.auth?.userId !== userId?.trim().toLowerCase()) {
        return reply.status(403).send({ ok: false, message: 'no access' });
    }
};
const requireSelf = [requireAuth, verifySelf];

const verifySelfOrAdmin: AuthHook = async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    const isSelf = req.auth?.userId === userId?.trim().toLowerCase();
    const isAdmin = req.auth?.role === 'admin';

    if (!isSelf && !isAdmin) {
        return reply.status(403).send({ ok: false, message: 'no access' });
    }
};
const requireSelfOrAdmin = [requireAuth, verifySelfOrAdmin];

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    UserErrors.setupErrorHandler(fastify);
    AvatarErrors.setupErrorHandler(fastify);

    fastify.post('/', { schema: schemas.CreateUserSchema }, controllers.createUser);

    fastify.get('/:userId', { schema: schemas.GetUserByIdSchema, preHandler: requireSelfOrAdmin }, controllers.getUserById);

    fastify.patch('/:userId/profile', { schema: schemas.UpdateUserProfileSchema, preHandler: requireSelf }, controllers.updateUserProfile);

    fastify.put('/:userId/avatar', { schema: schemas.UpdateUserAvatarSchema, preHandler: requireSelf }, controllers.updateUserAvatar);
    fastify.delete('/:userId/avatar', { schema: schemas.DeleteUserAvatarSchema, preHandler: requireSelf }, controllers.deleteUserAvatar);

    fastify.patch('/:userId/customization', { schema: schemas.UpdateUserCustomizationSchema, preHandler: requireSelf }, controllers.updateUserCustomization);
    fastify.patch('/:userId/password', { schema: schemas.UpdateUserPasswordSchema, preHandler: requireSelf }, controllers.updateUserPassword);

    fastify.patch('/:userId/status', { schema: schemas.UpdateUserStatusSchema, preHandler: requireAdmin }, controllers.updateUserStatus);
    fastify.patch('/:userId/role', { schema: schemas.UpdateUserRoleSchema, preHandler: requireAdmin }, controllers.updateUserRole);

    fastify.delete('/:userId', { schema: schemas.DeleteUserSchema, preHandler: requireSelfOrAdmin }, controllers.deleteUser);

    fastify.post('/:userId/links', { schema: schemas.CreateUserLinkSchema, preHandler: requireSelf }, controllers.createUserLink);
    fastify.get('/:userId/links', { schema: schemas.ListUserLinksSchema, preHandler: requireSelfOrAdmin }, controllers.listUserLinks);
    fastify.put('/:userId/links/:userLinkId', { schema: schemas.UpdateUserLinkSchema, preHandler: requireSelf }, controllers.updateUserLink);
    fastify.delete('/:userId/links/:userLinkId', { schema: schemas.DeleteUserLinkSchema, preHandler: requireSelf }, controllers.deleteUserLink);
};

export default modulePlugin;
