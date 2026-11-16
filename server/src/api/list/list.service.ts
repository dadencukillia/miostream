import type { Pool } from "pg";
import {
  countListUnits,
  createListUnit as createListUnitQuery,
  deleteListUnit as deleteListUnitQuery,
  getListUnit,
  listListUnits,
  updateListUnit as updateListUnitQuery,
} from "@/sqlc/anime_list_units_sql";
import { ListErrors } from "./list.errors";
import {
  parseListUnitDate,
  toListUnitModel,
  toListUnitWithAnimeModel,
} from "./list.model";
import type {
  CreateListUnitRequestPayloadType,
  GetListUnitsRequestQueriesType,
  ListUnitResponseType,
  ListUnitsPageResponseType,
  UpdateListUnitRequestPayloadType
} from "./list.dto";

function mapDbError(error: any): never {
	if (error?.code === "23505") {
		throw ListErrors.error("list-already-exists");
	}
	if (error?.code === "23503") {
		throw ListErrors.error("list-not-found").withMessage("anime not found");
	}
	if (["22P02", "23502", "23514"].includes(error?.code)) {
		throw ListErrors.error("list-invalid");
	}
	throw error;
}

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

	const row = await createListUnitQuery(db, {
		userId,
		animeId: input.animeId,
		watchedEpisodes,
		repeatTimes,
		startedWatching: parseListUnitDate(startedWatching),
		listUnitStatus,
		grade,
	}).catch(mapDbError);
	if (!row) {
		throw ListErrors.error("list-not-found");
	}
	return toListUnitModel(row);
}

export async function updateListUnit(
	db: Pool,
	userId: string,
	animeId: string,
	input: UpdateListUnitRequestPayloadType,
): Promise<ListUnitResponseType> {
	const existing = await getListUnit(db, { userId, animeId });
	if (!existing) {
		throw ListErrors.error("list-not-found");
	}

	const row = await updateListUnitQuery(db, {
		userId,
		animeId,
		watchedEpisodes: input.watchedEpisodes ?? existing.watchedEpisodes,
		repeatTimes: input.repeatTimes ?? existing.repeatTimes,
		startedWatching: input.startedWatching !== undefined ? parseListUnitDate(input.startedWatching) : existing.startedWatching,
		listUnitStatus: input.listUnitStatus ?? existing.listUnitStatus,
		grade: input.grade !== undefined ? input.grade : existing.grade,
	}).catch(mapDbError);
	if (!row) {
		throw ListErrors.error("list-not-found");
	}
	return toListUnitModel(row);
}

export async function deleteListUnit(db: Pool, userId: string, animeId: string): Promise<void> {
	const row = await deleteListUnitQuery(db, { userId, animeId });
	if (!row) {
		throw ListErrors.error("list-not-found");
	}
}

export async function getListUnits(
	db: Pool,
	userId: string,
	query: GetListUnitsRequestQueriesType,
): Promise<ListUnitsPageResponseType> {
	const page = query.page ?? 1;
	const limit = query.limit ?? 20;
	const offset = (page - 1) * limit;
	const status = query.status ?? null;
	const sort = query.sort ?? "startedWatching";

	const [counted, rows] = await Promise.all([
		countListUnits(db, { userId, status }),
		listListUnits(db, { userId, status, sort, limit, offset }),
	]);
	const total = counted?.total ?? 0;

	const items = rows.map((row) => toListUnitWithAnimeModel(row));

	return {
		items,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}
