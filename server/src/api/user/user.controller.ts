import type { 
    FastifyInstance, 
    FastifyPluginOptions, 
    FastifyRequest, 
    FastifyReply 
} from 'fastify';
import {
    createUserSchema,
    getUserSchema,
    updateUserSchema,
    deleteUserSchema,
    type UserParams,
    type CreateUserInput,
    type UpdateUserInput
} from './user.schema';
import { UserService } from './user.service';

export class UserController{
    constructor(private readonly userService: UserService) {}

    registerRoutes = async (
        fastify: FastifyInstance,
        _opts: FastifyPluginOptions
    ) => {
        fastify.post('/', { schema: createUserSchema }, this.createUser);
        fastify.get('/:id', { schema: getUserSchema }, this.getUser);
        fastify.put('/:id', { schema: updateUserSchema }, this.updateUser);
        fastify.delete('/:id', { schema: deleteUserSchema }, this.deleteUser);
    };

    createUser = async (
        request: FastifyRequest<{ Body: CreateUserInput }>,
        reply: FastifyReply
    ) => {
        const body = request.body;
        const user = await this.userService.create(body)
        return reply.status(201).send(user);
    }

    getUser = async (
        request: FastifyRequest<{ Params: UserParams }>,
        reply: FastifyReply
    ) => {
        const id = request.params.id;
        const user = await this.userService.getById(id)
        return reply.status(200).send(user);
    }

    updateUser = async (
        request: FastifyRequest<{ Params: UserParams; Body: UpdateUserInput }>,
        reply: FastifyReply
    ) => {
        const body = request.body;
        const id = request.params.id;
        const user = await this.userService.update(id, body)
        return reply.status(200).send(user);
    }

    deleteUser = async (
        request: FastifyRequest<{ Params: UserParams }>,
        reply: FastifyReply
    ) => {
        const id = request.params.id;
        await this.userService.delete(id)
        return reply.status(204).send();
    }

}
