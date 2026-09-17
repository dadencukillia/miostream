import { sleep } from "bun";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export interface Connection<T> {
  name: string,
  initFunc: () => Promise<T>,
};

export interface ConnectorPluginOptions {
  connections: Connection<any>[];
  retries: number;
  interval: number;
};

async function connectorPlugin(
  fastify: FastifyInstance,
  options: ConnectorPluginOptions
) {
  await Promise.all(
    options.connections.map(async (conn) => {
      fastify.log.info(`fastify-connector-plugin: initializing ${ conn.name }...`);

      let tries = 0;

      while (true) {
        try {

          const client = await conn.initFunc();
          fastify.decorate(conn.name, client);
          fastify.log.info(`fastify-connector-plugin: initialized ${ conn.name }`);
          break;

        } catch(e) {
          fastify.log.error(`${ conn.name } init error: ${ e }`);

          if (tries < options.retries || options.retries < 0) {
            await sleep(options.interval);
            tries++;
            fastify.log.info(`${ conn.name } try #${ tries }`);
            continue;
          }

          throw e;
        }
      }

    })
  );
}

export default fp(connectorPlugin, { 
  name: 'fastify-connector-plugin',
});
