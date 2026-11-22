import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import * as schemas from "./comment.schema";
import * as controllers from "./comment.controller";
import { CommentErrors } from "./comment.errors";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    CommentErrors.setupErrorHandler(fastify, [CommentErrors], true, true);

    fastify.get("/", { schema: schemas.GetCommentsSchema }, controllers.getComments);
    fastify.post("/", { schema: schemas.PostCommentSchema, preHandler: grantAuthMiddleware() }, controllers.postComment);
    fastify.put("/:commentId", { schema: schemas.UpdateCommentSchema, preHandler: grantAuthMiddleware() }, controllers.updateComment);
    fastify.delete("/:commentId", { schema: schemas.DeleteCommentSchema, preHandler: grantAuthMiddleware() }, controllers.deleteComment);
};

export default modulePlugin;
