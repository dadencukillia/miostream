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
    deleteUserSchema
} from './user.schema';
import { userService } from './user.service';

async function userController(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) : Promise<void> 
{
    fastify.post('/', { schema: createUserSchema }, 
        async (request: FastifyRequest, reply: FastifyReply) => {
            const body = request.body as any;
            const user = await userService.create(body)
            return reply.status(201).send(user);
        }
    );
}

export default userController;