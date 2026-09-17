import Fastify from "fastify";
import api from "./api/plugin";
import cdn from "./cdn/plugin";

const fastify = Fastify({
  logger: true
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
