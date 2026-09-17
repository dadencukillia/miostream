import Fastify from "fastify";
import connector from "./utils/connector";
import { S3Connection } from "./connections/s3";
import api from "./api/plugin";
import cdn from "./cdn/plugin";

const fastify = Fastify({
  logger: true,
  pluginTimeout: 0,
});

fastify.register(connector, {
  retries: 3,
  interval: 15 * 1000, // 15 seconds
  connections: [
    S3Connection
  ],
});

fastify.get("/healthcheck", (_request, reply) => {
  reply.send({ health: true });
});

fastify.register(api, { prefix: "/api" });
fastify.register(cdn, { prefix: "/cdn" });

fastify.listen({ port: 8080, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});
