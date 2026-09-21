import type {
    FastifyPluginCallback,
    FastifyError
} from "fastify";
import { UserError } from './errors'
import * as userSchema from './schema';
import * as userController from './controller';

const plugin: FastifyPluginCallback = (fastify, _opts) => {
    fastify.setErrorHandler<FastifyError>((error, request, reply) => {
        if (error.validation) {
            return reply.status(400).send({
                ok: false,
                message: error.message,
            })
        }

        if (error instanceof UserError) {
            return reply.status(error.status).send({
                ok: false,
                message: error.message,
            });
        }

        request.log.error(error);
        return reply.status(500).send({
            ok: false,
            message: 'Unexpected error',
        });
    });

    fastify.post('/', { schema: userSchema.createUserSchema }, userController.createUser);
    fastify.get('/:id', { schema: userSchema.getUserSchema }, userController.getUser);
    fastify.patch('/:id', { schema: userSchema.updateUserSchema }, userController.updateUser);
    fastify.delete('/:id', { schema: userSchema.deleteUserSchema }, userController.deleteUser);
}

export default plugin;