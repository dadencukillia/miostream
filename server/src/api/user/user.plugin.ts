import type { FastifyPluginAsync, FastifyError } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { UserError } from './user.errors';
import * as userSchema from './user.schema';
import * as userController from './user.controller';

const plugin: FastifyPluginAsync = async (fastify, _opts) => {
    const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

    server.setErrorHandler<FastifyError>((error, request, reply) => {
        if (error.validation) {
            return reply.status(400).send({
                ok: false,
                message: error.message
            });
        }

        if (error instanceof UserError) {
            return reply.status(error.status).send({
                ok: false,
                message: error.message
            });
        }

        request.log.error(error);
        return reply.status(500).send({
            ok: false,
            message: 'Unexpected error'
        });
    });

    server.post('/', { schema: userSchema.createUserRouteSchema }, userController.createUser);

    server.get('/:user_id', { schema: userSchema.getUserByIdRouteSchema }, userController.getUserById);

    server.patch('/:user_id/profile', { schema: userSchema.updateUserProfileRouteSchema }, userController.updateUserProfile);
    server.patch('/:user_id/avatar', { schema: userSchema.updateUserAvatarRouteSchema }, userController.updateUserAvatar);
    server.patch('/:user_id/customization', { schema: userSchema.updateUserCustomizationRouteSchema }, userController.updateUserCustomization);
    server.patch('/:user_id/password', { schema: userSchema.updateUserPasswordRouteSchema }, userController.updateUserPassword);
    server.patch('/:user_id/status', { schema: userSchema.updateUserStatusRouteSchema }, userController.updateUserStatus);
    server.patch('/:user_id/role', { schema: userSchema.updateUserRoleRouteSchema }, userController.updateUserRole);

    server.delete('/:user_id', { schema: userSchema.deleteUserRouteSchema }, userController.deleteUser);

    server.post('/:user_id/links', { schema: userSchema.createUserLinkRouteSchema }, userController.createUserLink);
    server.get('/:user_id/links', { schema: userSchema.listUserLinksRouteSchema }, userController.listUserLinks);
    server.put('/:user_id/links/:user_link_id', { schema: userSchema.updateUserLinkRouteSchema }, userController.updateUserLink);
    server.delete('/:user_id/links/:user_link_id', { schema: userSchema.deleteUserLinkRouteSchema }, userController.deleteUserLink);
};

export default plugin;