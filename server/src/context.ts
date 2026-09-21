declare module "fastify" {
	interface FastifyRequest {
		user?: { id: number };
	}
}
