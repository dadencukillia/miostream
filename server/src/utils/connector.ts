import { sleep } from "bun";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

/**
 * Interface representing an external connection wrapper (e.g., S3, Postgres, Redis).
 */
export interface Connection<T> {
  /** The name of the connection used to decorate the Fastify instance (e.g., 's3', 'db'). */
  name: string,

  /** Async factory function to establish and return the client instance. */
  initFunc: (fastify: FastifyInstance) => Promise<T>,

  /** Async cleanup function executed during Fastify's `preClose` lifecycle phase. */
  dropFunc: (fastify: FastifyInstance, instance: T) => Promise<void>,
};

/**
 * Options for the connector plugin managing resilient infrastructure dependencies.
 */
export interface ConnectorPluginOptions {
  /** List of connection adapters to initialize in parallel. */
  connections: Connection<any>[];

  /**
   * Maximum number of initialization retry attempts per connection.
   * Set to a negative number (e.g., -1) for infinite retries.
   */
  retries: number;

  /** Delay in milliseconds between retry attempts. */
  interval: number;
};

/**
 * Fastify plugin that concurrently initializes external services with automatic retry logic,
 * decorates the Fastify instance, and registers graceful shutdown hooks.
 */
async function connectorPlugin(
  fastify: FastifyInstance,
  options: ConnectorPluginOptions
) {
  // Initialize all connections concurrently to optimize startup time
  await Promise.all(
    options.connections.map(async (conn) => {
      fastify.log.info(`fastify-connector-plugin: initializing ${ conn.name }...`);

      let tries = 0;

      while (true) {
        try {
          // Attempt to establish the client connection
          const client = await conn.initFunc(fastify);

          // Decorate Fastify instance for global/scoped access (e.g., fastify.s3)
          fastify.decorate(conn.name, client);

          // Register graceful teardown hook triggered during server shutdown
          fastify.addHook("preClose", () => {
            fastify.log.info(`fastify-connector-plugin: closing ${ conn.name }...`);
            return conn.dropFunc(fastify, client);
          });

          fastify.log.info(`fastify-connector-plugin: initialized ${ conn.name }`);
          break; // Successfully connected and decorated, exit loop

        } catch(e) {
          fastify.log.error(`${ conn.name } init error: ${ e }`);

          // Retry if max attempts not reached OR if infinite retries are enabled (< 0)
          if (tries < options.retries || options.retries < 0) {
            await sleep(options.interval);
            tries++;
            fastify.log.info(`${ conn.name } try #${ tries }`);
            continue;
          }

          // Exhausted retries; propagate error to halt Fastify startup sequence
          throw e;
        }
      }

    })
  );
}

/**
 * Fastify plugin that concurrently initializes external services with automatic retry logic,
 * decorates the Fastify instance, and registers graceful shutdown hooks.
 *
 * @example
 * ```typescript
 * declare module 'fastify' {
 *  interface FastifyInstance {
 *    s3: S3Client;
 *  }
 * }
 *
 * const fastify = Fastify({
 *  logger: true,
 *  pluginTimeout: 0,
 * });
 *
 * fastify.register(connector, {
 *  retries: 3,
 *  interval: 15 * 1000, // 15 seconds
 *  connections: [
 *    S3Connection
 *  ],
 * });
 *
 * await fastify.ready();
 * // or
 * fastify.listen({ ... });
 * ```
 */
export default fp(connectorPlugin, { 
  name: 'fastify-connector-plugin',
});
