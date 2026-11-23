import * as config from "@config";
import { Config, Embedder, Index, RecordAny } from "meilisearch";

export function embedderFromEnv(): Embedder|undefined {
  const embedderUrl = config.EMBEDDER_URL.trim();
  const embedderApiKey = config.EMBEDDER_API_KEY.trim();
  const embedderModel = config.EMBEDDER_MODEL.trim();

  if (embedderUrl === "" || embedderApiKey === "" || embedderModel === "") return null;

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
    const embedderIndex = new HybridIndex(config, uid, primaryKey);
    if (embedder) {
      embedderIndex.setEmbedder(embedder);
    }
    return embedderIndex;
  };
}

export class HybridIndex<T extends RecordAny> extends Index<T> {
  private _embedderSet: boolean = false;
  private _locales: string[] = [];

  constructor(config: Config, uid: string, primaryKey: string) {
    super(config, uid, primaryKey);

  }

  public async setLocales(locales: string[]) {
    this._locales = locales;
  }

  public async setEmbedder(embedder: Embedder) {
    await this.updateEmbedders({
      default: embedder
    });
  }

  public async hybridSearch(query: string) {
    super.search(query, {
      hybrid: this._embedderSet ? {
        embedder: "default"
      } : undefined,
      locales: this._locales.length === 0 ? undefined : this._locales
    });
  }
}
