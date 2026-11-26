import type { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import * as schemas from "./schedule.schema";
import * as controllers from "./schedule.controller";
import { ScheduleErrors } from "./schedule.errors";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

const modulePlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
    ScheduleErrors.setupErrorHandler(fastify, [ScheduleErrors], true, true);

    fastify.get(
        "/",
        { schema: schemas.GetUpcomingEpisodesSchema },
        controllers.getUpcomingEpisodes
    );

    fastify.delete(
        "/:upcomingEpisodeId",
        {
            schema: schemas.DeleteUpcomingEpisodeSchema,
            preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }),
        },
        controllers.deleteUpcomingEpisode
    );

    fastify.post(
        "/",
        {
            schema: schemas.CreateUpcomingEpisodeSchema,
            preHandler: grantAuthMiddleware({ userHasRole: ["admin"] }),
        },
        controllers.createUpcomingEpisode
    );
};

export default modulePlugin;