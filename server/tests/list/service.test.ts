import { expect, test } from "bun:test";
import type { Pool } from "pg";
import { ListErrors } from "@/api/list/list.errors";
import { getListUnits, updateListUnit } from "@/api/list/list.service";

const userId = "018f23ab-1234-7123-8123-123456789abc";
const animeId = "018f23ab-1234-7123-8123-123456789def";

function fakeDb(missing = false) {
	const calls: { text: string; values: unknown[]; rowMode?: string }[] = [];
	const db = {
		query: async (input: string | { text: string; values: unknown[]; rowMode?: string }, values?: unknown[]) => {
			const query = typeof input === "string" ? { text: input, values: values ?? [] } : input;
			calls.push(query);
			const row = {
				user_id: userId,
				anime_id: animeId,
				watched_episodes: 3,
				repeat_times: 1,
				started_watching: "2026-01-02",
				list_unit_status: "watching",
				grade: null,
			};
			return { rows: missing ? [] : [query.rowMode === "array" ? Object.values(row) : row] };
		},
	} as unknown as Pool;
	return { db, calls };
}

test("update returns all fields from the updated row", async () => {
	const { db, calls } = fakeDb();
	const result = await updateListUnit(db, userId, animeId, { watchedEpisodes: 3, grade: null });

	expect(result).toEqual({
		userId,
		animeId,
		watchedEpisodes: 3,
		repeatTimes: 1,
		startedWatching: "2026-01-02",
		listUnitStatus: "watching",
		grade: null,
	});
	expect(calls[0]?.values).toEqual([userId, animeId, 3, null]);
});

test("update reports a missing list unit", async () => {
	const { db } = fakeDb(true);
	await expect(updateListUnit(db, userId, animeId, { watchedEpisodes: 3 })).rejects.toMatchObject({ collection: ListErrors, statusCode: 404 });
});

for (const sort of [undefined, "startedWatching", "title", "grade"] as const) {
 test(`list maps results and honors sort ${sort}`, async () => {
  const calls: any[] = [];
  const db = { query: async (query: any) => {
   calls.push(query);
   expect(query.rowMode).toBe("array");
   return { rows: query.text.includes("COUNT(*)") ? [[21]] : [[animeId, "slug", "Назва", "Title", null, 3, 1, "2026-01-02", "watching", 4]] };
  } } as unknown as Pool;
  const result = await getListUnits(db, userId, { page: 2, limit: 10, status: "watching", sort });
  expect(result).toEqual({ items: [{ animeId, slug: "slug", titleUa: "Назва", titleEn: "Title", coverUrl: "", watchedEpisodes: 3, repeatTimes: 1, startedWatching: "2026-01-02", listUnitStatus: "watching", grade: 4 }], pagination: { page: 2, limit: 10, total: 21, totalPages: 3 } });
  expect(calls[0].values).toEqual([userId, "watching"]);
  expect(calls[1].values).toEqual([userId, "watching", 10, 10]);
  expect(calls[1].text).toContain("a.cover_id");
  const ordering = sort === "title" ? "a.title_ua ASC" : sort === "grade" ? "lu.grade DESC NULLS LAST, a.title_ua ASC" : "lu.started_watching DESC, a.title_ua ASC";
  expect(calls[1].text).toContain(`ORDER BY ${ordering}\n`);
 });
}
test("list rejects unknown sort before querying", async () => {
 const { db, calls } = fakeDb();
 await expect(getListUnits(db, userId, { sort: "title; DROP TABLE animes" } as any)).rejects.toMatchObject({ statusCode: 400 });
 expect(calls).toHaveLength(0);
});
