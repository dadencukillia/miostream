import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as schemas from './user.schema';
import * as controllers from './user.controller';
import { UserErrors, AvatarErrors } from './user.errors';

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    // TODO(auth): add authentication hook (401) and reject banned/deactivated users.
    // TODO(auth): add module augmentation for request.user ({ id, role, status }).

    UserErrors.setupErrorHandler(fastify);
    AvatarErrors.setupErrorHandler(fastify);

    // TODO(auth): public registration; add rate limit.
    fastify.post('/', { schema: schemas.createUserRouteSchema }, controllers.createUser);

    // TODO(auth): self or admin; decide whether profile is public (then split response schema).
    fastify.get('/:userId', { schema: schemas.getUserByIdRouteSchema }, controllers.getUserById);

    // TODO(auth): self only for profile, avatar, customization and password.
    // TODO(auth): rate limit password route.
    fastify.patch('/:userId/profile', { schema: schemas.updateUserProfileRouteSchema }, controllers.updateUserProfile);

    fastify.put('/:userId/avatar', { schema: schemas.updateUserAvatarRouteSchema }, controllers.updateUserAvatar);
    fastify.delete('/:userId/avatar', { schema: schemas.deleteUserAvatarSchema }, controllers.deleteUserAvatar);

    fastify.patch('/:userId/customization', { schema: schemas.updateUserCustomizationRouteSchema }, controllers.updateUserCustomization);
    fastify.patch('/:userId/password', { schema: schemas.updateUserPasswordRouteSchema }, controllers.updateUserPassword);
    // TODO(admin): admin only for status and role.
    fastify.patch('/:userId/status', { schema: schemas.updateUserStatusRouteSchema }, controllers.updateUserStatus);
    fastify.patch('/:userId/role', { schema: schemas.updateUserRoleRouteSchema }, controllers.updateUserRole);

    // TODO(auth): self or admin.
    fastify.delete('/:userId', { schema: schemas.deleteUserRouteSchema }, controllers.deleteUser);

    // TODO(auth): self only for create/update/delete; GET depends on profile visibility.
    fastify.post('/:userId/links', { schema: schemas.createUserLinkRouteSchema }, controllers.createUserLink);
    fastify.get('/:userId/links', { schema: schemas.listUserLinksRouteSchema }, controllers.listUserLinks);
    fastify.put('/:userId/links/:userLinkId', { schema: schemas.updateUserLinkRouteSchema }, controllers.updateUserLink);
    fastify.delete('/:userId/links/:userLinkId', { schema: schemas.deleteUserLinkRouteSchema }, controllers.deleteUserLink);

    // TODO(admin): add admin-only GET / (user list) with pagination and filters.
};

export default modulePlugin;
