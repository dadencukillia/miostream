import type { FastifyReply, FastifyRequest } from "fastify";

export function cookieValue(request: FastifyRequest, name: string) {
	return request.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

export interface CookieOptions {
	httpOnly?: boolean,
	secure?: boolean,
	sameSite?: "Strict"|"Lax"|"None",
	maxAge?: number,
	path?: string,
}

export function setCookie(reply: FastifyReply, name: string, value: string, options: CookieOptions = {}) {
	const parts = [`${name}=${value}`, `Path=${options.path ?? "/"}`];

	if (options.httpOnly) parts.push("HttpOnly");
	if (options.secure) parts.push("Secure");
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
	if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);

	const previous = reply.getHeader("Set-Cookie");
	const headers = previous == null ? [] : Array.isArray(previous) ? previous : [String(previous)];

	reply.header("Set-Cookie", [...headers, parts.join("; ")]);
}
