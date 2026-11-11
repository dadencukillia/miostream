import type { Static } from "typebox";
import * as schemas from "./avatar.schema";
import { ErrorResponse } from "@/utils/errorsCollection";

export type AvatarIdRequestParamsType = Static<typeof schemas.AvatarIdRequestParams>;
export type AvatarResponse = Static<typeof schemas.AvatarResponse>;
export type GetAvatarReturnType = AvatarResponse|Static<typeof ErrorResponse>;
