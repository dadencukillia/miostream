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
    fastify.post('/', { schema: schemas.CreateUserSchema }, controllers.createUser);

    // TODO(auth): self or admin; decide whether profile is public (then split response schema).
    fastify.get('/:userId', { schema: schemas.GetUserByIdSchema }, controllers.getUserById);

    // TODO(auth): self only for profile, avatar, customization and password.
    // TODO(auth): rate limit password route.
    fastify.patch('/:userId/profile', { schema: schemas.UpdateUserProfileSchema }, controllers.updateUserProfile);

    fastify.put('/:userId/avatar', { schema: schemas.UpdateUserAvatarSchema }, controllers.updateUserAvatar);
    fastify.delete('/:userId/avatar', { schema: schemas.DeleteUserAvatarSchema }, controllers.deleteUserAvatar);

    fastify.patch('/:userId/customization', { schema: schemas.UpdateUserCustomizationSchema }, controllers.updateUserCustomization);
    fastify.patch('/:userId/password', { schema: schemas.UpdateUserPasswordSchema }, controllers.updateUserPassword);
    // TODO(admin): admin only for status and role.
    fastify.patch('/:userId/status', { schema: schemas.UpdateUserStatusSchema }, controllers.updateUserStatus);
    fastify.patch('/:userId/role', { schema: schemas.UpdateUserRoleSchema }, controllers.updateUserRole);

    // TODO(auth): self or admin.
    fastify.delete('/:userId', { schema: schemas.DeleteUserSchema }, controllers.deleteUser);

    // TODO(auth): self only for create/update/delete; GET depends on profile visibility.
    fastify.post('/:userId/links', { schema: schemas.CreateUserLinkSchema }, controllers.createUserLink);
    fastify.get('/:userId/links', { schema: schemas.ListUserLinksSchema }, controllers.listUserLinks);
    fastify.put('/:userId/links/:userLinkId', { schema: schemas.UpdateUserLinkSchema }, controllers.updateUserLink);
    fastify.delete('/:userId/links/:userLinkId', { schema: schemas.DeleteUserLinkSchema }, controllers.deleteUserLink);

    // TODO(admin): add admin-only GET / (user list) with pagination and filters.
};

export default modulePlugin;
