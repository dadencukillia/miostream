import type { Static } from "typebox";
import type * as schemas from "./preview.schema";
import type { ErrorResponse } from "@lib/errorsCollection";

export type PreviewIdRequestParamsType = Static<typeof schemas.PreviewIdRequestParams>;
export type PreviewResponse = Static<typeof schemas.PreviewResponse>;
export type GetPreviewReturnType = PreviewResponse | Static<typeof ErrorResponse>;
