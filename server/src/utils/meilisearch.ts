import * as config from "@config";
import { Config, Embedder, Filter, Index, MeilisearchError, MeilisearchErrorResponse, RecordAny } from "meilisearch";
import { Client } from "pg";

export function embedderFromEnv(): Embedder|undefined {
  const embedderUrl = config.EMBEDDER_URL.trim();
  const embedderApiKey = config.EMBEDDER_API_KEY.trim();
  const embedderModel = config.EMBEDDER_MODEL.trim();

  if (embedderUrl === "" || embedderApiKey === "" || embedderModel === "") return undefined;

  return {
    "source": "rest",
    "url": embedderUrl,
    "apiKey": embedderApiKey,
    "request": {
      "model": embedderModel,
      "input": [
        "{{text}}",
        "{{..}}"
      ],
      "encoding_format": "float"
    },
    "response": {
      "data": [
        {
          "embedding": "{{embedding}}"
        },
        "{{..}}"
      ]
    }
  }
}

export function hybridIndexGenerator(config: Config, embedder?: Embedder) {
  return async <T extends RecordAny>(uid: string, primaryKey: string): Promise<HybridIndex<T>> => {
    const embedderIndex = new HybridIndex<T>(config, uid, primaryKey);
    if (embedder) {
      await embedderIndex.setEmbedder(embedder);
    }
    return embedderIndex;
  };
}

export class HybridIndex<T extends RecordAny> extends Index<T> {
  private _embedderSet: boolean = false;
  private _locales: string[] = [];

  public setLocales(locales: string[]) {
    this._locales = locales;
  }

  public async setEmbedder(embedder: Embedder) {
    this._embedderSet = true;
    await this.updateEmbedders({
      default: embedder
    });
  }

  public async hybridSearch(query: string, filter?: Filter) {
    return super.search(query, {
      hybrid: this._embedderSet ? {
        embedder: "default"
      } : undefined,
      locales: this._locales.length === 0 ? undefined : this._locales,
      filter,
      rankingScoreThreshold: 0.65,
      showRankingScore: true,
      limit: 10
    });
  }
}

export const envIndexGenerator = hybridIndexGenerator({
  host: config.MEILI_HOST,
  apiKey: config.MEILI_MASTER_KEY
}, embedderFromEnv());

export async function cliAddAnimes(animes: RecordAny[]) {
  if (animes.length === 0) {
    console.log("Nothing added");
    return;
  }

  const CHUNK_SIZE = 20;
  const chunksCount = Math.ceil(animes.length / CHUNK_SIZE);

  console.log(`Found ${animes.length} anime entries`);
  console.log(`Chunks by ${CHUNK_SIZE} anime entries`);

  const index = await envIndexGenerator("animes", "anime_id");

  const tasks: number[] = [];
  for (let chunkIndex = 0; chunkIndex < chunksCount; chunkIndex++) {
    const chunkContent = animes.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);
    const task = await index.addDocuments(chunkContent);
    tasks.push(task.taskUid);
  }

  const writer = Bun.stdout.writer();
  const printProgressLine = async (done: number) => {
    const progressLineLength = 12;
    const progressLineValue = Math.round(done / chunksCount * progressLineLength);
    await writer.write(`${done}/${chunksCount} [${ "=".repeat(progressLineValue) }${ " ".repeat(progressLineLength - progressLineValue) }]            \r`);
    await writer.flush();
  };

  const checkTasks = async (): Promise<{
    done: number,
    failed: number,
    taskErrors: MeilisearchErrorResponse[]
  }> => {
    let done = 0;
    let failed = 0;
    let taskErrors: MeilisearchErrorResponse[] = [];
    for await (const task of tasks) {
      const info = await index.tasks.getTask(task);
      if (info.status === "succeeded") done++;
      else if (info.status === "failed") {
        failed++;
        if (info.error) taskErrors.push(info.error);
      }
    }

    return { done, failed, taskErrors };
  };

  while(true) {
    const result = await checkTasks();
    const totalProccessed = result.done + result.failed;
    await printProgressLine(totalProccessed);
    if (totalProccessed === chunksCount) {
      console.log(`${result.done} chunks added successfully`);
      console.log(`${result.failed} chunks failed`);
      result.taskErrors.forEach(e => console.log(e));
      break;
    }

    await Bun.sleep(3_000);
  }
}

export async function cliSyncAnimeMeilisearch() {
  const client = new Client({ connectionString: config.DB_URL });
  await client.connect();

  const animes = await client.query(`SELECT anime_id AS "animeId", title_ua AS "titleUa", title_en AS "titleEn", title_original AS "titleOriginal", available FROM public.animes;`);

  await client.end();

  if (animes.rowCount === null) return;
  cliAddAnimes(animes.rows);
}
