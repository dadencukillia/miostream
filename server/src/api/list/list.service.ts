import type { Pool } from "pg";
import { createListUnit as createListUnitQuery } from "@/sqlc/list_units_sql";
import type { CreateListUnitRequestPayloadType, ListUnitResponseType, UpdateListUnitRequestPayloadType } from "./list.dto";
import { ListAlreadyExistsError, ListInvalidError, ListNotFoundError } from "./list.errors";

export async function createListUnit(
	db: Pool,
	userId: string,
	input: CreateListUnitRequestPayloadType,
): Promise<ListUnitResponseType> {
	const watchedEpisodes = input.watchedEpisodes ?? 0;
	const repeatTimes = input.repeatTimes ?? 0;
	const startedWatching = input.startedWatching ?? new Date().toISOString().slice(0, 10);
	const listUnitStatus = input.listUnitStatus ?? "watching";
	const grade = input.grade ?? null;

	try {
		const row = await createListUnitQuery(db as any, {
			userId,
			animeId: input.animeId,
			watchedEpisodes,
			repeatTimes,
			startedWatching,
			listUnitStatus: listUnitStatus as "finished" | "watching" | "delayed" | "dropped",
			grade,
		});
		return {
			userId: row.userId,
			animeId: row.animeId,
			watchedEpisodes: row.watchedEpisodes,
			repeatTimes: row.repeatTimes,
			startedWatching: row.startedWatching,
			listUnitStatus: row.listUnitStatus as "finished" | "watching" | "delayed" | "dropped",
			grade: row.grade,
		};
	} catch (error: any) {
		if (error?.code === "23505") {
			throw new ListAlreadyExistsError("list unit already exists");
		}
		if (error?.code === "23503") {
			throw new ListNotFoundError("anime not found");
		}
		const clientDataErrors = new Set(["22P02", "23502", "23514"]);
		if (clientDataErrors.has(error?.code)) {
			throw new ListInvalidError("invalid list unit data");
		}
		throw error;
	}
}
export async function updateListUnit(
	db: Pool,
	userId: string,
	animeId: string,
	input: UpdateListUnitRequestPayloadType,
): Promise<ListUnitResponseType> {
	const fields: string[] = [];
	const values: any[] = [];
	let idx = 3; // $1 = userId, $2 = animeId

	if (input.watchedEpisodes !== undefined) {
		fields.push(`watched_episodes = $${idx++}::int`);
		values.push(input.watchedEpisodes);
	}
	if (input.repeatTimes !== undefined) {
		fields.push(`repeat_times = $${idx++}::int`);
		values.push(input.repeatTimes);
	}
	if (input.startedWatching !== undefined) {
		fields.push(`started_watching = $${idx++}::date`);
		values.push(input.startedWatching);
	}
	if (input.listUnitStatus !== undefined) {
		fields.push(`list_unit_status = $${idx++}::anime_list_unit_status_enum`);
		values.push(input.listUnitStatus);
	}
	if (input.grade !== undefined) {
		fields.push(`grade = $${idx++}::smallint`);
		values.push(input.grade);
	}

	if (fields.length === 0) {
		throw new ListInvalidError("invalid list unit data");
	}

	const sql = `UPDATE public.anime_list_units SET ${fields.join(", ")} WHERE user_id = $1::uuid AND anime_id = $2::uuid RETURNING user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade`;
	const result = await db.query({ text: sql, values: [userId, animeId, ...values], rowMode: "array" });
	const row = result.rows[0] as any;
	if (!row) {
		throw new ListNotFoundError("list unit not found");
	}
	return {
		userId: row[0],
		animeId: row[1],
		watchedEpisodes: row[2],
		repeatTimes: row[3],
		startedWatching: row[4],
		listUnitStatus: row[5] as "finished" | "watching" | "delayed" | "dropped",
		grade: row[6],
	};
}

export async function deleteListUnit(db: Pool, userId: string, animeId: string): Promise<void> {
	const result = await db.query({ text: `DELETE FROM public.anime_list_units WHERE user_id = $1::uuid AND anime_id = $2::uuid`, values: [userId, animeId], rowMode: "array" });
	if ((result as any).rowCount === 0) {
		throw new ListNotFoundError("list unit not found");
	}
}
