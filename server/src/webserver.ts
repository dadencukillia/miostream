import Fastify, { FastifyInstance, FastifyPluginAsync } from "fastify";
import connector, { Connection } from "./utils/connector";
import { PostgresConnection } from "./connections/pg";
import { S3Connection } from "./connections/s3";
import api from "./api/api.plugin";
import cdn from "./cdn/cdn.plugin";
import healthcheck from "./healthcheck";
import { openapiJSONPlugin, openapiUIPlugin } from "./openapi";

// Modules

export interface FastifyWebServerModule {
  endpoint: string,
  connections: Connection<any>[],
  plugin: FastifyPluginAsync,
}

const webServerModules = {
  api: {
    endpoint: "/api",
    connections: [PostgresConnection, S3Connection],
    plugin: api,
  } as FastifyWebServerModule,
  cdn: {
    endpoint: "/cdn",
    connections: [PostgresConnection, S3Connection],
    plugin: cdn,
  } as FastifyWebServerModule,
  healthcheck: {
    endpoint: "/healthcheck",
    connections: [],
    plugin: healthcheck,
  } as FastifyWebServerModule,
  openapi: {
    endpoint: "/openapi",
    connections: [],
    plugin: openapiJSONPlugin,
  } as FastifyWebServerModule,
  openapiui: {
    endpoint: "/openapi",
    connections: [],
    plugin: openapiUIPlugin,
  } as FastifyWebServerModule,
} as const;

// Config

export interface WebServerConfiguration {
  modules?: (keyof typeof webServerModules|FastifyWebServerModule|null)[],
  port?: number
}

const defaultWebServerConfiguration: Required<WebServerConfiguration> = {
  modules: ["api", "cdn", "healthcheck", "openapi"],
  port: 8080
}

// Web server

export class FastifyWebServer {
  private readonly _config: Required<WebServerConfiguration>;
  private readonly _modules: Readonly<FastifyWebServerModule>[];

  public constructor(config: WebServerConfiguration = defaultWebServerConfiguration) {
    this._config = {
      modules: config.modules ?? defaultWebServerConfiguration.modules,
      port: config.port ?? defaultWebServerConfiguration.port
    };

    this._modules = this._config.modules
      .filter(e => e != null)
      .map(e => {
      return typeof e === "string"
        ? webServerModules[e]
        : Object.freeze(e);
    });
  }

  private connectionsList(): Connection<any>[] {
    return Array.from(new Set(...this._modules.map(e => e.connections)));
  }

  public _pureFastifyInstance(): FastifyInstance {
    return Fastify({
      logger: true,
      pluginTimeout: 0,
      ajv: {
        customOptions: {
          unicodeRegExp: true,
          removeAdditional: false,
        }
      },
    });
  }

  public async _fastifyRegisterConnections(fastify: FastifyInstance, connections?: Connection<any>[]) {
    await fastify.register(connector, {
      retries: 3,
      interval: 15 * 1000, // 15 seconds
      connections: connections ?? this.connectionsList(),
    });
  }

  public async _fastifyRegisterModules(fastify: FastifyInstance) {
    for (const module of this._modules) {
      await fastify.register(module.plugin, {
        prefix: module.endpoint
      });
    }
  }

  public async _fastifyRun(fastify: FastifyInstance) {
    const shutdown = async () => {
      fastify.log.info('Stopping server...');
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await fastify.listen({ port: this._config.port, host: '0.0.0.0' });
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  }

  public async run() {
    const fastify = this._pureFastifyInstance();
    await this._fastifyRegisterConnections(fastify);
    await this._fastifyRegisterModules(fastify);
    await this._fastifyRun(fastify);
  }
}
