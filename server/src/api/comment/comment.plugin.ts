import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import * as schemas from "./comment.schema";
import * as controllers from "./comment.controller";
import { CommentErrors } from "./comment.errors";
import { grantAuthMiddleware } from "../auth/auth.middleware";

type AuthHook = (req: FastifyRequest<any>, reply: FastifyReply<any>) => Promise<void | unknown>;

const requireAuth = grantAuthMiddleware() as AuthHook;

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    CommentErrors.setupErrorHandler(fastify);

    fastify.get("/", { schema: schemas.GetCommentsSchema }, controllers.getComments);
    fastify.post("/", { schema: schemas.PostCommentSchema, preHandler: requireAuth }, controllers.postComment);
    fastify.put("/:commentId", { schema: schemas.UpdateCommentSchema, preHandler: requireAuth }, controllers.updateComment);
};

export default modulePlugin;