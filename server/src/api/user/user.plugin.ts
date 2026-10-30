import type { FastifyPluginAsync, FastifyError } from 'fastify';
import { UserError } from './user.errors';
import * as userSchema from './user.schema';
import * as userController from './user.controller';

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
    // TODO(auth): add authentication hook (401) and reject banned/deactivated users.
    // TODO(auth): add module augmentation for request.user ({ id, role, status }).

    fastify.setErrorHandler<FastifyError>((error, request, reply) => {
        if (reply.sent) return;
        
        if (error.validation) {
            return reply.status(400).send({
                ok: false,
                message: error.message
            });
        }

        if (error instanceof UserError) {
            if (error.status >= 500) {
                request.log.error({ err: error }, error.message);
            }
            return reply.status(error.status).send({ ok: false, message: error.message });
        }

        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            return reply.status(error.statusCode).send({ ok: false, message: error.message });
        }

        request.log.error({ err: error }, 'Unhandled server error');
        return reply.status(500).send({
            ok: false,
            message: 'Unexpected error'
        });
    });

    // TODO(auth): public registration; add rate limit.
    fastify.post('/', { schema: userSchema.createUserRouteSchema }, userController.createUser);

    // TODO(auth): self or admin; decide whether profile is public (then split response schema).
    fastify.get('/:userId', { schema: userSchema.getUserByIdRouteSchema }, userController.getUserById);

    // TODO(auth): self only for profile, avatar, customization and password.
    // TODO(auth): rate limit password route.
    fastify.patch('/:userId/profile', { schema: userSchema.updateUserProfileRouteSchema }, userController.updateUserProfile);
    fastify.patch('/:userId/avatar', { schema: userSchema.updateUserAvatarRouteSchema }, userController.updateUserAvatar);
    fastify.patch('/:userId/customization', { schema: userSchema.updateUserCustomizationRouteSchema }, userController.updateUserCustomization);
    fastify.patch('/:userId/password', { schema: userSchema.updateUserPasswordRouteSchema }, userController.updateUserPassword);
    // TODO(admin): admin only for status and role.
    fastify.patch('/:userId/status', { schema: userSchema.updateUserStatusRouteSchema }, userController.updateUserStatus);
    fastify.patch('/:userId/role', { schema: userSchema.updateUserRoleRouteSchema }, userController.updateUserRole);

    // TODO(auth): self or admin.
    fastify.delete('/:userId', { schema: userSchema.deleteUserRouteSchema }, userController.deleteUser);

    // TODO(auth): self only for create/update/delete; GET depends on profile visibility.
    fastify.post('/:userId/links', { schema: userSchema.createUserLinkRouteSchema }, userController.createUserLink);
    fastify.get('/:userId/links', { schema: userSchema.listUserLinksRouteSchema }, userController.listUserLinks);
    fastify.put('/:userId/links/:userLinkId', { schema: userSchema.updateUserLinkRouteSchema }, userController.updateUserLink);
    fastify.delete('/:userId/links/:userLinkId', { schema: userSchema.deleteUserLinkRouteSchema }, userController.deleteUserLink);

    // TODO(admin): add admin-only GET / (user list) with pagination and filters.
};

export default plugin;