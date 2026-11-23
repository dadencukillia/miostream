import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as schemas from "./preview.schema";
import * as controllers from "./preview.controller";
import { PreviewErrors } from "./preview.errors";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
	PreviewErrors.setupErrorHandler(fastify, [PreviewErrors], true, true);

	fastify.get("/:previewId.webp", { schema: schemas.GetPreviewSchema }, controllers.getPreview);
};

export default modulePlugin;
