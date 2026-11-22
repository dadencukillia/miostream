import { FastifyWebServer } from "@/webserver";
import { FastifyInstance } from "fastify";

export const fastifyInstance = async (): Promise<FastifyInstance> => {
  const webserver = new FastifyWebServer({
    modules: ["api", "cdn"]
  });
  const fastifyInstance = webserver._pureFastifyInstance();
  await webserver._fastifyRegisterConnections(fastifyInstance);
  await webserver._fastifyRegisterModules(fastifyInstance);
  await fastifyInstance.ready();
  return fastifyInstance;
};
