import { expect, test } from "bun:test";
import type { Pool } from "pg";
import { ListErrors } from "@/api/list/list.errors";
import { getListUnits, updateListUnit } from "@/api/list/list.service";

const userId = "018f23ab-1234-7123-8123-123456789abc";
const animeId = "018f23ab-1234-7123-8123-123456789def";

type Call = { text: string; values: unknown[]; rowMode?: string };

function fakeDb(missing = false) {
	const calls: Call[] = [];
	const listUnit = [userId, animeId, 3, 1, new Date(2026, 0, 2), "watching", null];
	const db = {
		query: async (input: Call) => {
			calls.push(input);
			const name = /^-- name: (\w+)/.exec(input.text)?.[1];
			if (name === "CountListUnits") return { rows: [[21]] };
			if (name === "ListListUnits") return { rows: [[animeId, "slug", "Назва", "Title", null, 3, 1, new Date(2026, 0, 2), "watching", 4]] };
			return { rows: missing ? [] : [listUnit] };
		},
	} as unknown as Pool;
	return { db, calls };
}

test("update merges unchanged fields and returns all fields from the updated row", async () => {
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
	const update = calls.find((call) => call.text.includes("-- name: UpdateListUnit"));
	expect(update?.values).toEqual(expect.arrayContaining([3, 1, "watching", null, userId, animeId]));
});

test("update reports a missing list unit", async () => {
	const { db } = fakeDb(true);
	await expect(updateListUnit(db, userId, animeId, { watchedEpisodes: 3 })).rejects.toMatchObject({ collection: ListErrors, statusCode: 404 });
});

for (const sort of [undefined, "startedWatching", "title", "grade"] as const) {
	test(`list maps results and passes sort ${sort ?? "default"} to the query`, async () => {
		const { db, calls } = fakeDb();
		const result = await getListUnits(db, userId, { page: 2, limit: 10, status: "watching", sort });
		expect(result).toEqual({
			items: [{ animeId, slug: "slug", titleUa: "Назва", titleEn: "Title", coverUrl: "", watchedEpisodes: 3, repeatTimes: 1, startedWatching: "2026-01-02", listUnitStatus: "watching", grade: 4 }],
			pagination: { page: 2, limit: 10, total: 21, totalPages: 3 },
		});
		const list = calls.find((call) => call.text.includes("-- name: ListListUnits"));
		expect(list?.values).toEqual(expect.arrayContaining([userId, "watching", sort ?? "startedWatching", 10, 10]));
	});
}

test("grade null is sent through null_fields to reset a nullable list unit field", async () => {
	const { db, calls } = fakeDb();
	await updateListUnit(db, userId, animeId, { grade: null });

	const update = calls.find((call) => call.text.includes("-- name: UpdateListUnit"))!;
	expect(update.values[4]).toEqual(["grade"]);
	expect(update.values[5]).toBeNull();
	expect(update.values.slice(0, 4)).toEqual([3, 1, expect.any(Date), "watching"]);
});

test("omitted grade keeps null_fields empty and sends null to preserve the value", async () => {
	const { db, calls } = fakeDb();
	await updateListUnit(db, userId, animeId, { watchedEpisodes: 7 });

	const update = calls.find((call) => call.text.includes("-- name: UpdateListUnit"))!;
	expect(update.values[4]).toEqual([]);
	expect(update.values[5]).toBeNull();
	expect(update.values[0]).toBe(7);
});
