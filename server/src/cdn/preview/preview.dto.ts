import type { Static } from "typebox";
import type * as previewSchema from "./preview.schema";
import { ErrorResponse } from "@lib/errorsCollection";

// Responses
export type ErrorResponseType = Static<typeof ErrorResponse>;
export type PreviewResponseType = Static<typeof previewSchema.PreviewResponse>;

// Request Params
export type PreviewIdRequestParamsType = Static<typeof previewSchema.PreviewIdRequestParams>;

// Controller Return Types
export type GetPreviewReturnType = PreviewResponseType | null | ErrorResponseType;