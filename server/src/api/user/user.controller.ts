import type { 
    FastifyInstance, 
    FastifyPluginOptions, 
    FastifyRequest, 
    FastifyReply,
    FastifyError
} from 'fastify';
import {
    createUserSchema,
    getUserSchema,
    updateUserSchema,
    deleteUserSchema
} from './user.schema';
import type {
    UserParams,
    CreateUserInput,
    UpdateUserInput
} from './user.dto';
import { UserService } from './user.service';
import { UserError } from './user.errors'

export class UserController{
    constructor(private readonly userService: UserService) {}

    registerRoutes = async (
        fastify: FastifyInstance,
        _opts: FastifyPluginOptions
    ) => {
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
        
        fastify.post('/', { schema: createUserSchema }, this.createUser);
        fastify.get('/:id', { schema: getUserSchema }, this.getUser);
        fastify.patch('/:id', { schema: updateUserSchema }, this.updateUser);
        fastify.delete('/:id', { schema: deleteUserSchema }, this.deleteUser);
    };

    createUser = async (
        request: FastifyRequest<{ Body: CreateUserInput }>,
        reply: FastifyReply
    ) => {
        const user = await this.userService.create(request.body);
        return reply.status(201).send(user);
    };

    getUser = async (
        request: FastifyRequest<{ Params: UserParams }>,
        reply: FastifyReply
    ) => {
        const user = await this.userService.getById(request.params.id);
        return reply.status(200).send(user);
    };

    updateUser = async (
        request: FastifyRequest<{ Params: UserParams; Body: UpdateUserInput }>,
        reply: FastifyReply
    ) => {
        const user = await this.userService.update(request.params.id, request.body);
        return reply.status(200).send(user);
    };

    deleteUser = async (
        request: FastifyRequest<{ Params: UserParams }>,
        reply: FastifyReply
    ) => {
        await this.userService.delete(request.params.id);
        return reply.status(204).send();
    };
}
