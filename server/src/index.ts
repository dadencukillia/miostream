import { FastifyWebServer } from "./webserver";

const webserver = new FastifyWebServer({
  modules: ["api", "cdn", "healthcheck", "openapi", "openapiui"],
  port: 8080,
});

await webserver.run();
