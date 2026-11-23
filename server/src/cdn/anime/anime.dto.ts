import type { Static } from "typebox";
import type * as schemas from "./anime.schema";
import type { ErrorResponse } from "@/utils/errorsCollection";

export type AnimeIdRequestParamsType = Static<typeof schemas.AnimeIdRequestParams>;
export type AnimeCoverResponse = Static<typeof schemas.AnimeCoverResponse>;
export type GetAnimeCoverReturnType = AnimeCoverResponse | Static<typeof ErrorResponse>;
