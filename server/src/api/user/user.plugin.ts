import type { FastifyPluginAsync, FastifyError } from 'fastify';
import { UserError } from './user.errors';
import * as userSchema from './user.schema';
import * as userController from './user.controller';

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
    fastify.setErrorHandler<FastifyError>((error, request, reply) => {
        if (error.validation) {
            return reply.status(400).send({
                ok: false,
                message: error.message
            });
        }

        if (error instanceof UserError) {
            if (error.status >= 500) {
                request.log.error(error);
                return reply.status(500).send({ ok: false, message: 'Unexpected error' });
            }
            return reply.status(error.status).send({ ok: false, message: error.message });
        }

        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
            return reply.status(error.statusCode).send({ ok: false, message: error.message });
        }

        request.log.error(error);
        return reply.status(500).send({
            ok: false,
            message: 'Unexpected error'
        });
    });

    fastify.post('/', { schema: userSchema.createUserRouteSchema }, userController.createUser);

    fastify.get('/:userId', { schema: userSchema.getUserByIdRouteSchema }, userController.getUserById);

    fastify.patch('/:userId/profile', { schema: userSchema.updateUserProfileRouteSchema }, userController.updateUserProfile);
    fastify.patch('/:userId/avatar', { schema: userSchema.updateUserAvatarRouteSchema }, userController.updateUserAvatar);
    fastify.patch('/:userId/customization', { schema: userSchema.updateUserCustomizationRouteSchema }, userController.updateUserCustomization);
    fastify.patch('/:userId/password', { schema: userSchema.updateUserPasswordRouteSchema }, userController.updateUserPassword);
    fastify.patch('/:userId/status', { schema: userSchema.updateUserStatusRouteSchema }, userController.updateUserStatus);
    fastify.patch('/:userId/role', { schema: userSchema.updateUserRoleRouteSchema }, userController.updateUserRole);

    fastify.delete('/:userId', { schema: userSchema.deleteUserRouteSchema }, userController.deleteUser);

    fastify.post('/:userId/links', { schema: userSchema.createUserLinkRouteSchema }, userController.createUserLink);
    fastify.get('/:userId/links', { schema: userSchema.listUserLinksRouteSchema }, userController.listUserLinks);
    fastify.put('/:userId/links/:userLinkId', { schema: userSchema.updateUserLinkRouteSchema }, userController.updateUserLink);
    fastify.delete('/:userId/links/:userLinkId', { schema: userSchema.deleteUserLinkRouteSchema }, userController.deleteUserLink);
};

export default plugin;