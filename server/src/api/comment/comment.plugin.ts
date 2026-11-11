import type { FastifyPluginAsync, FastifyInstance, FastifyPluginOptions } from "fastify";
import * as schemas from "./comment.schema";
import * as controllers from "./comment.controller";
import { CommentErrors } from "./comment.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    CommentErrors.setupErrorHandler(fastify);

    fastify.get("/", { schema: schemas.GetCommentsSchema }, controllers.getComments);
};

export default modulePlugin;