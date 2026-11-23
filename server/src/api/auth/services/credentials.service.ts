import type { Pool } from "pg";
import type * as dto from "../auth.dto";
import type { UserType } from "@/api/user/user.dto";
import * as userServices from "@/api/user/user.shared";
import { UserErrors } from "@/api/user/user.errors";
import { isUuid } from "@utils/uuid";
import { isReservedNickname } from "@utils/nickname";

export async function registerUser(
    client: Pool,
    data: dto.RegisterRequestPayloadType
): Promise<UserType> {
    const nickname = data.nickname.trim();
    const fullName = data.fullName.trim();
    const email = data.email.trim();

    if (isUuid(nickname) || isReservedNickname(nickname)) {
        throw UserErrors.error("user-invalid");
    }

    if (fullName.length < 2) {
        throw UserErrors.error("user-invalid");
    }

    const user = await userServices.createUser(client, {
        email,
        nickname,
        fullName,
        password: data.password,
    });

    // TODO: send verification/welcome email to user.email

    return user;
}
