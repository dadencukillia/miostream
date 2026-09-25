import type {
    FastifyRequest,
    FastifyReply,
} from 'fastify';
import type {
    UserParams,
    CreateUserRequest,
    UpdateUserRequest
} from './dto';
import * as userService from './service';

export const createUser = async (
    request: FastifyRequest<{ Body: CreateUserRequest }>,
    reply: FastifyReply
) => {
    const user = await userService.createUser(request.body);
    return reply.status(201).send(user);
};

export const getUser = async (
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
) => {
    const user = await userService.getUserById(request.params.id);
    return reply.status(200).send(user);
};

export const updateUser = async (
    request: FastifyRequest<{ Params: UserParams; Body: UpdateUserRequest }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUser(request.params.id, request.body);
    return reply.status(200).send(user);
};

export const deleteUser = async (
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
) => {
    await userService.deleteUser(request.params.id);
    return reply.status(204).send();
};

