import type { Pool } from "pg";
import {
  countListUnits,
  createListUnit as createListUnitQuery,
  deleteListUnit as deleteListUnitQuery,
  getListUnit,
  listListUnits,
  updateListUnit as updateListUnitQuery,
  type CreateListUnitRow,
  type UpdateListUnitRow,
} from "@/sqlc/anime_list_units_sql";
import { ListErrors } from "./list.errors";
import type {
  CreateListUnitRequestPayloadType,
  GetListUnitsRequestQueriesType,
  ListUnitResponseType,
  ListUnitsPageResponseType,
  UpdateListUnitRequestPayloadType
} from "./list.dto";

type ListUnitStatus = "finished" | "watching" | "delayed" | "dropped";

function toLocalDate(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year!, month! - 1, day!);
}

function toDateString(value: Date): string {
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");
	return `${value.getFullYear()}-${month}-${day}`;
}

function toListUnit(row: CreateListUnitRow | UpdateListUnitRow): ListUnitResponseType {
	return {
		userId: row.userId,
		animeId: row.animeId,
		watchedEpisodes: row.watchedEpisodes,
		repeatTimes: row.repeatTimes,
		startedWatching: toDateString(row.startedWatching),
		listUnitStatus: row.listUnitStatus as ListUnitStatus,
		grade: row.grade,
	};
}

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
		startedWatching: toLocalDate(startedWatching),
		listUnitStatus,
		grade,
	}).catch(mapDbError);
	if (!row) {
		throw ListErrors.error("list-not-found");
	}
	return toListUnit(row);
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
		startedWatching: input.startedWatching !== undefined ? toLocalDate(input.startedWatching) : existing.startedWatching,
		listUnitStatus: input.listUnitStatus ?? existing.listUnitStatus,
		grade: input.grade !== undefined ? input.grade : existing.grade,
	}).catch(mapDbError);
	if (!row) {
		throw ListErrors.error("list-not-found");
	}
	return toListUnit(row);
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

	const items = rows.map((row) => ({
		animeId: row.animeId,
		slug: row.slug,
		titleUa: row.titleUa,
		titleEn: row.titleEn,
		// Cover URL resolution is not available yet.
		coverUrl: "",
		watchedEpisodes: row.watchedEpisodes,
		repeatTimes: row.repeatTimes,
		startedWatching: toDateString(row.startedWatching),
		listUnitStatus: row.listUnitStatus as ListUnitStatus,
		grade: row.grade,
	}));

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
