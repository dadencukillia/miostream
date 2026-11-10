import type { Pool } from "pg";
import { createListUnit as createListUnitQuery } from "@/sqlc/list_units_sql";
import type { CreateListUnitRequestPayloadType, ListUnitResponseType } from "./list.dto";
import { ListAlreadyExistsError, ListInvalidError } from "./list.errors";

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
		throw new ListInvalidError("invalid list unit data");
	}
}