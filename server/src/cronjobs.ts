import { runHttpOutboxCron } from "@utils/httpOutbox";
import { FastifyPluginAsync } from "fastify";

export const outboxPlugin: FastifyPluginAsync = async (fastify, _opts) => {
  runHttpOutboxCron(fastify.pg, fastify.log, 5_000);
};
