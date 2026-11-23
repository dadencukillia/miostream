import type { Static } from "typebox";
import type * as schemas from "./avatar.schema";
import type { ErrorResponse } from "@lib/errorsCollection";

export type AvatarIdRequestParamsType = Static<typeof schemas.AvatarIdRequestParams>;
export type AvatarResponse = Static<typeof schemas.AvatarResponse>;
export type GetAvatarReturnType = AvatarResponse|Static<typeof ErrorResponse>;
