import type { FastifyRequest } from "fastify";

export function cookieValue(request: FastifyRequest, name: string) {
	return request.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}
