import Fastify, { FastifyInstance, FastifyPluginAsync } from "fastify";
import connector, { Connection } from "./utils/connector";
import { PostgresConnection } from "./connections/pg";
import { S3Connection } from "./connections/s3";
import api from "./api/api.plugin";
import cdn from "./cdn/cdn.plugin";
import healthcheck from "./healthcheck";
import { openapiJSONPlugin, openapiUIPlugin } from "./openapi";

// Modules

/**
 * Represents a modular web server component/plugin definition.
 */
export interface FastifyWebServerModule {
  /** The URL prefix path where the module will be mounted. */
  endpoint: string,
  /** List of database or external service connections required by this module. */
  connections: Connection<any>[],
  /** The Fastify plugin asynchronous function. */
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

/**
 * Configuration options for the FastifyWebServer instance.
 */
export interface WebServerConfiguration {
  /** List of modules to load (can be module keys, custom module objects, or null/undefined to skip). */
  modules?: (keyof typeof webServerModules|FastifyWebServerModule|null)[],
  /** The network port on which the web server will listen. */
  port?: number
}

const defaultWebServerConfiguration: Required<WebServerConfiguration> = {
  modules: ["api", "cdn", "healthcheck", "openapi"],
  port: 8080
}

// Web server

/**
 * A modular Fastify web server wrapper responsible for lifecycle management,
 * dynamic plugin registration, and connection pool orchestration.
 */
export class FastifyWebServer {
  private readonly _config: Required<WebServerConfiguration>;
  private readonly _modules: Readonly<FastifyWebServerModule>[];

  /**
   * Creates an instance of FastifyWebServer.
   * 
   * @param config - Optional configuration object to override default modules or port settings.
   */
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

  /**
   * Collects and de-duplicates all required database/service connections across active modules.
   * 
   * @returns An array of unique connection instances.
   */
  private connectionsList(): Connection<any>[] {
    return Array.from(new Set(...this._modules.map(e => e.connections)));
  }

  /**
   * Instantiates and configures a pure, uninitialized Fastify instance with custom AJV settings and logging.
   * 
   * @returns A configured `FastifyInstance`.
   */
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

  /**
   * Registers required connections (like PostgreSQL or S3) via the connector plugin.
   * 
   * @param fastify - The Fastify instance to register connections into.
   * @param connections - Optional explicit list of connections to register. Defaults to all module-required connections.
   */
  public async _fastifyRegisterConnections(fastify: FastifyInstance, connections?: Connection<any>[]) {
    await fastify.register(connector, {
      retries: 3,
      interval: 15 * 1000, // 15 seconds
      connections: connections ?? this.connectionsList(),
    });
  }

  /**
   * Registers all active modules into the Fastify instance with their respective prefixes.
   * 
   * @param fastify - The Fastify instance where modules will be registered.
   */
  public async _fastifyRegisterModules(fastify: FastifyInstance) {
    for (const module of this._modules) {
      await fastify.register(module.plugin, {
        prefix: module.endpoint
      });
    }
  }

  /**
   * Binds process signal listeners (SIGINT, SIGTERM) for graceful shutdown and starts listening on the configured port.
   * 
   * @param fastify - The initialized Fastify instance to run.
   */
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

  /**
   * Runs the complete web server lifecycle: creates the Fastify instance, registers connections, loads modules, and starts listening.
   */
  public async run() {
    const fastify = this._pureFastifyInstance();
    await this._fastifyRegisterConnections(fastify);
    await this._fastifyRegisterModules(fastify);
    await this._fastifyRun(fastify);
  }
}
