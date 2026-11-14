import { expect, test } from "bun:test";
import Fastify from "fastify";
import list from "@/api/list/list.plugin";
const id = "018f23ab-1234-7123-8123-123456789abc";
test("list blocks unverified mutations and preserves client errors", async () => {
 const app = Fastify();
 app.decorate("pg", { query() { throw new Error("Unexpected database access"); } });
 app.register(list);
 try {
  for (const authorization of [undefined, "Bearer user", "Bearer admin", "Bearer forged.jwt.token"]) {
   for (const request of [
    { method: "POST" as const, url: "/", payload: { animeId: id } },
    { method: "PATCH" as const, url: `/${id}`, payload: { grade: 3 } },
    { method: "DELETE" as const, url: `/${id}` },
   ]) {
    const response = await app.inject({ ...request, headers: authorization ? { authorization } : {} });
    expect(response.statusCode).toBe(503);
   }
  }
  expect((await app.inject({ method: "GET", url: `/${id}?sort=unknown` })).statusCode).toBe(400);
  expect((await app.inject({ method: "POST", url: "/", headers: { "content-type": "application/xml" }, payload: "<body/>" })).statusCode).toBe(415);
 } finally { await app.close(); }
});
