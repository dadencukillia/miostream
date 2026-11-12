import { expect, test } from "bun:test";
import type { Pool } from "pg";
import { ListErrors } from "@/api/list/list.errors";
import { updateListUnit } from "@/api/list/list.service";

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
