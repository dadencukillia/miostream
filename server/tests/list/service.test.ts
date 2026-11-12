import { describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import * as service from "@/api/list/list.service";
import { ListAlreadyExistsError, ListInvalidError, ListNotFoundError } from "@/api/list/list.errors";

const userId = "a7b3fd74-00ab-4d5c-949e-07c135475bd1";
const animeId = "018f23ab-1234-7123-8123-123456789abc";
const unit = { userId, animeId, watchedEpisodes: 12, repeatTimes: 2, startedWatching: "2026-01-01", listUnitStatus: "finished" as const, grade: 5 };
const row = Object.values(unit);

// Keep the real SQL adapter, replacing only the database boundary.
function fakeDb(options: { rows?: unknown[][]; rowCount?: number; error?: unknown } = {}) {
  const calls: { text: string; values: unknown[]; rowMode?: string }[] = [];
  const db = {
    async query(input: string | { text: string; values: unknown[]; rowMode?: string }, values?: unknown[]) {
      calls.push(typeof input === "string" ? { text: input, values: values ?? [] } : input);
      if (options.error !== undefined) throw options.error;
      return { rows: options.rows ?? [row], rowCount: options.rowCount ?? 1 };
    },
  } as unknown as Pool;
  return { db, calls };
}

describe("list service", () => {
  test("creates with UTC date and defaults and maps the generated adapter response", async () => {
    const fake = fakeDb();
    const before = new Date().toISOString().slice(0, 10);
    const result = await service.createListUnit(fake.db, userId, { animeId });
    const after = new Date().toISOString().slice(0, 10);
    expect(result).toEqual(unit);
    expect(fake.calls).toHaveLength(1);
    const call = fake.calls[0]!;
    expect(call.text).toContain("INSERT INTO public.anime_list_units");
    expect(call.rowMode).toBe("array");
    expect([before, after]).toContain(call.values[4] as string);
    expect(call.values).toEqual([userId, animeId, 0, 0, call.values[4], "watching", null]);
  });

  test.each(["finished", "watching", "delayed", "dropped"] as const)("preserves explicit values with status %s", async (listUnitStatus) => {
    const input = { animeId, watchedEpisodes: 0, repeatTimes: 0, startedWatching: "2020-02-29", listUnitStatus, grade: 0 };
    const fake = fakeDb({ rows: [[userId, animeId, 0, 0, input.startedWatching, listUnitStatus, 0]] });
    expect(await service.createListUnit(fake.db, userId, input)).toEqual({ userId, ...input });
    expect(fake.calls[0]!.values).toEqual([userId, animeId, 0, 0, "2020-02-29", listUnitStatus, 0]);
  });

  test("passes all supplied tracking details to the insert", async () => {
    const fake = fakeDb();
    const { userId: _, ...input } = unit;
    await service.createListUnit(fake.db, userId, input);
    expect(fake.calls[0]!.values).toEqual(row);
  });

  test.each([
    [{ code: "23505" }, ListAlreadyExistsError, 409, "list unit already exists"],
    [{ code: "23503" }, ListInvalidError, 400, "invalid list unit data"],
    [{ code: "23514" }, ListInvalidError, 400, "invalid list unit data"],
    [new Error("private database details"), ListInvalidError, 400, "invalid list unit data"],
  ] as const)("translates create failure %#", async (error, ErrorType, status, message) => {
    const fake = fakeDb({ error });
    const result = service.createListUnit(fake.db, userId, { animeId });
    await expect(result).rejects.toBeInstanceOf(ErrorType);
    await expect(result).rejects.toMatchObject({ status, message });
  });

  test.each([
    [{ watchedEpisodes: 0 }, "watched_episodes", "int", 0],
    [{ repeatTimes: 0 }, "repeat_times", "int", 0],
    [{ startedWatching: "2024-02-29" }, "started_watching", "date", "2024-02-29"],
    [{ listUnitStatus: "dropped" }, "list_unit_status", "anime_list_unit_status_enum", "dropped"],
    [{ grade: 0 }, "grade", "smallint", 0],
    [{ grade: null }, "grade", "smallint", null],
  ] as const)("updates only the supplied field %#", async (input, column, cast, value) => {
    const fake = fakeDb();
    expect(await service.updateListUnit(fake.db, userId, animeId, input)).toEqual(unit);
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]!.values).toEqual([userId, animeId, value]);
    expect(fake.calls[0]!.text).toContain(`SET ${column} = $3::${cast} WHERE user_id = $1::uuid AND anime_id = $2::uuid RETURNING`);
  });

  test("binds multiple update fields in order and scopes the write to the user and anime", async () => {
    const fake = fakeDb();
    await service.updateListUnit(fake.db, userId, animeId, { grade: -5, listUnitStatus: "delayed", startedWatching: "2024-02-29", repeatTimes: 2, watchedEpisodes: 12 });
    expect(fake.calls[0]!.values).toEqual([userId, animeId, 12, 2, "2024-02-29", "delayed", -5]);
    expect(fake.calls[0]!.text).toContain("SET watched_episodes = $3::int, repeat_times = $4::int, started_watching = $5::date, list_unit_status = $6::anime_list_unit_status_enum, grade = $7::smallint WHERE user_id = $1::uuid AND anime_id = $2::uuid");
  });

  test.each([{}, { grade: undefined }, { watchedEpisodes: undefined, repeatTimes: undefined }])("rejects an update without defined fields %# before querying", async (input) => {
    const fake = fakeDb();
    await expect(service.updateListUnit(fake.db, userId, animeId, input)).rejects.toBeInstanceOf(ListInvalidError);
    expect(fake.calls).toHaveLength(0);
  });

  test("omitted update fields do not consume parameter positions", async () => {
    const fake = fakeDb();
    await service.updateListUnit(fake.db, userId, animeId, { watchedEpisodes: undefined, repeatTimes: 0, grade: null });
    expect(fake.calls[0]!.values).toEqual([userId, animeId, 0, null]);
    expect(fake.calls[0]!.text).toContain("SET repeat_times = $3::int, grade = $4::smallint WHERE");
  });

  test("reports a missing update target", async () => {
    const fake = fakeDb({ rows: [] });
    await expect(service.updateListUnit(fake.db, userId, animeId, { grade: 5 })).rejects.toMatchObject({ status: 404, message: "list unit not found" });
  });

  test("deletes only the authenticated user's anime and returns no value", async () => {
    const fake = fakeDb();
    await expect(service.deleteListUnit(fake.db, userId, animeId)).resolves.toBeUndefined();
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]!.text).toContain("DELETE FROM public.anime_list_units WHERE user_id = $1::uuid AND anime_id = $2::uuid");
    expect(fake.calls[0]!.values).toEqual([userId, animeId]);
  });

  test("reports a missing delete target", async () => {
    await expect(service.deleteListUnit(fakeDb({ rowCount: 0 }).db, userId, animeId)).rejects.toBeInstanceOf(ListNotFoundError);
  });

  test("propagates update and delete database failures", async () => {
    const error = new Error("connection lost");
    const fake = fakeDb({ error });
    await expect(service.updateListUnit(fake.db, userId, animeId, { grade: 5 })).rejects.toBe(error);
    await expect(service.deleteListUnit(fake.db, userId, animeId)).rejects.toBe(error);
  });
});
