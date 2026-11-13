import type { Pool } from "pg";
import { createListUnit as createListUnitQuery } from "@/sqlc/list_units_sql";
import { ListErrors } from "./list.errors";
import type {
  CreateListUnitRequestPayloadType,
  GetListUnitsRequestQueriesType,
  ListUnitResponseType,
  ListUnitsPageResponseType,
  UpdateListUnitRequestPayloadType
} from "./list.dto";

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
			throw ListErrors.error("list-already-exists");
		}
		if (error?.code === "23503") {
			throw ListErrors.error("list-not-found").withMessage("anime not found");
		}
		const clientDataErrors = new Set(["22P02", "23502", "23514"]);
		if (clientDataErrors.has(error?.code)) {
			throw ListErrors.error("list-invalid");
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
		throw ListErrors.error("list-invalid");
	}

	const sql = `UPDATE public.anime_list_units SET ${fields.join(", ")} WHERE user_id = $1::uuid AND anime_id = $2::uuid RETURNING user_id, anime_id, watched_episodes, repeat_times, started_watching, list_unit_status, grade`;
	const result = await db.query({ text: sql, values: [userId, animeId, ...values], rowMode: "array" });
	const row = result.rows[0] as any;
	if (!row) {
		throw ListErrors.error("list-not-found");
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

	const countResult = await db.query(
		`SELECT COUNT(*)::int AS total FROM public.anime_list_units WHERE user_id = $1::uuid AND ($2::anime_list_unit_status_enum IS NULL OR list_unit_status = $2::anime_list_unit_status_enum)`,
		[userId, status],
	);
	const total = countResult.rows[0]?.[0] ?? 0;

	const itemsResult = await db.query(
		`SELECT lu.anime_id, a.slug, a.title_ua, a.title_en, a.cover_url, lu.watched_episodes, lu.repeat_times, lu.started_watching, lu.list_unit_status, lu.grade
		 FROM public.anime_list_units lu
		 JOIN public.animes a ON a.anime_id = lu.anime_id
		 WHERE lu.user_id = $1::uuid
		   AND ($2::anime_list_unit_status_enum IS NULL OR lu.list_unit_status = $2::anime_list_unit_status_enum)
		 ORDER BY lu.started_watching DESC, a.title_ua ASC
		 LIMIT $3::int OFFSET $4::int`,
		[userId, status, limit, offset],
	);

	const items = (itemsResult.rows as any[]).map((row) => ({
		animeId: row[0],
		slug: row[1],
		titleUa: row[2],
		titleEn: row[3],
		coverUrl: row[4],
		watchedEpisodes: row[5],
		repeatTimes: row[6],
		startedWatching: row[7],
		listUnitStatus: row[8] as "finished" | "watching" | "delayed" | "dropped",
		grade: row[9],
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
