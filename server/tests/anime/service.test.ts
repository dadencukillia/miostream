import { describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import * as service from "../../src/api/anime/service";
import { AnimeAlreadyExistsError, AnimeInvalidError, AnimeNotFoundError } from "../../src/api/anime/errors";

const id = "018f23ab-1234-7123-8123-123456789abc";
const row = [id, "sample-anime", "Назва", "Title", "Original", "Description", "cover", "Studio", "123", "456", "hikka", "tt123", 2020, 24, 12, "pg13", "ongoing", "tv", true, ["action", "drama"]];

type Call = { name: string; text: string; values: unknown[] };

// Exercise the generated query adapters as well as the service without a database.
function fakeDb(options: { missing?: boolean; failAt?: string; error?: unknown; total?: number } = {}) {
  const calls: Call[] = [];
  let released = false;
  let genres = ["action", "drama"];
  let exists = !options.missing;
  const query = async (input: string | { text: string; values: unknown[] }) => {
    const text = typeof input === "string" ? input : input.text;
    const name = /^-- name: (\w+)/.exec(text)?.[1] ?? text;
    calls.push({ name, text, values: typeof input === "string" ? [] : input.values });
    if (name === options.failAt) throw options.error;
    if (/delete\s+from\s+(?:public\.)?genres/i.test(text)) { genres = []; return { rows: [], rowCount: 2 }; }
    if (/delete\s+from\s+(?:public\.)?animes/i.test(text)) {
      const deleted = exists;
      exists = false;
      return { rows: deleted ? [[id]] : [], rowCount: deleted ? 1 : 0 };
    }
    if (["GetAnimeById", "GetAnimeBySlug", "ListAnimes"].includes(name)) return { rows: exists ? [[...row.slice(0, 19), [...genres]]] : [] };
    if (name === "CountAnimes") return { rows: [[options.total ?? 1]] };
    if (name === "CreateAnime") return { rows: [[id]] };
    if (name === "CreateAnimeGenres" && typeof input !== "string") {
      genres = [...new Set([...genres, ...(input.values[1] as string[])])];
    }
    if (name === "UpdateAnimeById") return { rows: [row.slice(0, 19)] };
    return { rows: [], rowCount: 1 };
  };
  const client = { query, release: () => { released = true; } };
  return {
    db: { query, connect: async () => client } as unknown as Pool,
    calls,
    get released() { return released; },
  };
}

const byName = (calls: Call[], name: string) => calls.find((call) => call.name === name);

describe("anime service", () => {
  test("maps database rows, including numeric IDs and unknown enum values", () => {
    const anime = service.toAnime({
      animeId: id, slug: "sample-anime", titleUa: "Назва", titleEn: "Title", titleOriginal: "Original",
      animeDescription: "Description", coverUrl: "cover", productionStudio: "Studio", malId: "123", anilistId: null,
      hikkaId: null, imdbId: null, yearReleased: null, avgEpisodeDuration: 0, episodesCount: 0,
      ageRestriction: "unknown", animeStatus: "unknown", animeFormat: "unknown", available: false,
      genres: ["action", "unknown", "drama"],
    });
    expect(anime).toMatchObject({ malId: 123, anilistId: null, ageRestriction: null, animeStatus: null, animeFormat: "other", available: false, genres: ["action", "drama"] });
  });

  test("normalizes list filters and returns pagination and mapped items", async () => {
    const fake = fakeDb({ total: 21 });
    const result = await service.listAnimes(fake.db, { page: 2, limit: 10, search: "  Title  ", genre: "action", status: "ongoing", format: "tv", year: 2020, available: false, sort: "title" });
    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 21, total_pages: 3 });
    expect(result.items[0]).toMatchObject({ animeId: id, malId: 123, anilistId: 456, genres: ["action", "drama"] });
    expect(byName(fake.calls, "ListAnimes")?.values).toEqual(["Title", "action", "ongoing", "tv", 2020, false, "title", 10, 10]);
    expect(byName(fake.calls, "CountAnimes")?.values).toEqual(["Title", "action", "ongoing", "tv", 2020, false]);
  });

  test("uses list defaults and zero pages for an empty result", async () => {
    const fake = fakeDb({ missing: true, total: 0 });
    const result = await service.listAnimes(fake.db, { search: "   " });
    expect(result).toEqual({ items: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } });
    expect(byName(fake.calls, "ListAnimes")?.values).toEqual([null, null, null, null, null, true, "newest", 0, 20]);
  });

  test("retrieves by id and slug and reports missing records", async () => {
    const fake = fakeDb();
    expect((await service.getAnime(fake.db, id)).slug).toBe("sample-anime");
    expect((await service.getAnimeBySlug(fake.db, "sample-anime")).animeId).toBe(id);
    expect(byName(fake.calls, "GetAnimeById")?.values).toEqual([id]);
    expect(byName(fake.calls, "GetAnimeBySlug")?.values).toEqual(["sample-anime"]);
    const missing = fakeDb({ missing: true });
    await expect(service.getAnime(missing.db, id)).rejects.toBeInstanceOf(AnimeNotFoundError);
    await expect(service.getAnimeBySlug(missing.db, "missing")).rejects.toBeInstanceOf(AnimeNotFoundError);
  });

  test("rejects malformed ids and slugs before querying", async () => {
    const fake = fakeDb();
    for (const invalid of ["", "  ", "not-a-uuid", `${id}x`]) {
      await expect(service.getAnime(fake.db, invalid)).rejects.toBeInstanceOf(AnimeInvalidError);
    }
    for (const invalid of ["", "  ", "Uppercase", "-start", "end-", "two--hyphens", "a".repeat(201)]) {
      await expect(service.getAnimeBySlug(fake.db, invalid)).rejects.toBeInstanceOf(AnimeInvalidError);
    }
    expect(fake.calls).toHaveLength(0);
    await service.getAnimeBySlug(fake.db, "a".repeat(200));
    expect(fake.calls).toHaveLength(1);
  });

  test("creates with defaults, deduplicates genres, and commits the transaction", async () => {
    const fake = fakeDb();
    const result = await service.createAnime(fake.db, { slug: "sample-anime", titleEn: "Title", genres: ["action", "drama", "action"], malId: 123, available: false });
    expect(result.animeId).toBe(id);
    expect(fake.calls.map((call) => call.name)).toEqual(["BEGIN", "CreateAnime", "CreateAnimeGenres", "GetAnimeById", "COMMIT"]);
    expect(byName(fake.calls, "CreateAnime")?.values).toEqual(["sample-anime", "", "Title", "", "", "", "", "123", null, null, null, null, 0, 0, null, null, "tv", false]);
    expect(byName(fake.calls, "CreateAnimeGenres")?.values).toEqual([id, ["action", "drama"]]);
    expect(fake.released).toBe(true);
  });

  test("requires a valid slug and at least one nonblank title on creation", async () => {
    const fake = fakeDb();
    await expect(service.createAnime(fake.db, { slug: "bad_slug", titleEn: "Title" })).rejects.toBeInstanceOf(AnimeInvalidError);
    await expect(service.createAnime(fake.db, { slug: "valid", titleEn: "  ", titleOriginal: "" })).rejects.toBeInstanceOf(AnimeInvalidError);
    expect(fake.calls).toHaveLength(0);
  });

  test("rolls back and releases the client when inserting genres fails", async () => {
    const fake = fakeDb({ failAt: "CreateAnimeGenres", error: { code: "23503" } });
    await expect(service.createAnime(fake.db, { slug: "valid", titleEn: "Title", genres: ["action"] })).rejects.toThrow("Related record does not exist");
    expect(fake.calls.map((call) => call.name)).toEqual(["BEGIN", "CreateAnime", "CreateAnimeGenres", "ROLLBACK"]);
    expect(fake.released).toBe(true);
  });

  test("translates database errors and preserves unexpected errors", async () => {
    for (const [code, detail, message] of [
      ["23505", "slug", "Anime with this slug already exists"],
      ["23505", "mal_id", "Anime with this MAL ID already exists"],
      ["23505", "anilist_id", "Anime with this AniList ID already exists"],
      ["23505", "hikka_id", "Anime with this Hikka ID already exists"],
      ["23505", "imdb_id", "Anime with this IMDb ID already exists"],
      ["23505", "other", "Anime with the same unique fields already exists"],
      ["22P02", "", "Invalid data format or enum value"],
      ["22001", "", "Field value exceeds maximum allowed length"],
      ["23514", "", "Value violates a database constraint"],
      ["23503", "", "Related record does not exist"],
      ["23502", "", "Required field is missing"],
    ]) {
      const fake = fakeDb({ failAt: "GetAnimeById", error: { code, detail } });
      await expect(service.getAnime(fake.db, id)).rejects.toThrow(message);
    }
    const original = new Error("connection lost");
    const fake = fakeDb({ failAt: "GetAnimeById", error: original });
    await expect(service.getAnime(fake.db, id)).rejects.toBe(original);
    const duplicate = fakeDb({ failAt: "GetAnimeById", error: { code: "23505", constraint: "animes_slug_key" } });
    await expect(service.getAnime(duplicate.db, id)).rejects.toBeInstanceOf(AnimeAlreadyExistsError);
  });

  test("validates updates and merges unchanged fields", async () => {
    const fake = fakeDb();
    await expect(service.updateAnime(fake.db, id, {})).rejects.toBeInstanceOf(AnimeInvalidError);
    await expect(service.updateAnime(fake.db, id, { slug: "Bad" })).rejects.toBeInstanceOf(AnimeInvalidError);
    await expect(service.updateAnime(fake.db, id, { titleUa: " ", titleEn: "", titleOriginal: "" })).rejects.toBeInstanceOf(AnimeInvalidError);
    await service.updateAnime(fake.db, id, { titleEn: "New title", available: false, malId: null });
    expect(byName(fake.calls, "UpdateAnimeById")?.values).toEqual(["sample-anime", "Назва", "New title", "Original", "Description", "cover", "Studio", null, "456", "hikka", "tt123", 2020, 24, 12, "pg13", "ongoing", "tv", false, id]);
    expect(fake.released).toBe(true);
    await expect(service.updateAnime(fakeDb({ missing: true }).db, id, { titleEn: "New" })).rejects.toBeInstanceOf(AnimeNotFoundError);
  });

  test("a nullable update clears an existing external ID", async () => {
    const fake = fakeDb();
    await service.updateAnime(fake.db, id, { hikkaId: null });
    expect(byName(fake.calls, "UpdateAnimeById")?.values[9]).toBeNull();
  });

  test("replacing genres removes old genres, including when the new list is empty", async () => {
    const fake = fakeDb();
    const result = await service.updateAnime(fake.db, id, { genres: [] });
    expect(result.genres).toEqual([]);
  });

  test("replacing genres retains only the requested genres", async () => {
    const fake = fakeDb();
    const result = await service.updateAnime(fake.db, id, { genres: ["comedy"] });
    expect(result.genres).toEqual(["comedy"]);
  });

  test("deletes an existing anime", async () => {
    const fake = fakeDb();
    await expect(service.deleteAnime(fake.db, id)).resolves.toBeUndefined();
    await expect(service.getAnime(fake.db, id)).rejects.toBeInstanceOf(AnimeNotFoundError);
    await expect(service.deleteAnime(fake.db, id)).rejects.toBeInstanceOf(AnimeNotFoundError);
  });
});
