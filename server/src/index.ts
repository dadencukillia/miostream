import Fastify from "fastify";
import api from "./api/plugin";

const fastify = Fastify({
  logger: true
});

fastify.register(api, { prefix: "/api" });

fastify.listen({ port: 8080, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
});
