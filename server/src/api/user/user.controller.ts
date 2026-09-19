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
    type CreateUserInput
} from './user.schema';
import { UserService } from './user.service';

export class UserController{
    constructor(private readonly userService: UserService) {}

    registerRoutes = async (
        fastify: FastifyInstance,
        _opts: FastifyPluginOptions
    ) => {
        fastify.post('/', { schema: createUserSchema }, this.createUser);
    };

    createUser = async (
        request: FastifyRequest<{ Body: CreateUserInput }>,
        reply: FastifyReply
    ) => {
        const body = request.body as any;
        const user = await this.userService.registerUser(body)
        return reply.status(201).send(user);
    }
}
