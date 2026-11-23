import type { Pool } from "pg";
import type * as dto from "../auth.dto";
import { AuthErrors } from "../auth.errors";
import type { UserType } from "@/api/user/user.dto";
import * as userServices from "@/api/user/user.shared";
import { UserErrors } from "@/api/user/user.errors";
import { verifyPassword } from "@utils/password";
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

export async function loginUser(
    client: Pool,
    data: dto.LoginRequestPayloadType
): Promise<UserType> {
    const identifier = data.identifier.trim();
    if (identifier.length < 3) {
        throw AuthErrors.error("auth-invalid-credentials");
    }

    let authRecord;
    try {
        authRecord = await userServices.getUserForLogin(client, identifier);
    } catch (e: any) {
        if (e?.slug === "user-not-found") {
            throw AuthErrors.error("auth-invalid-credentials");
        }
        throw e;
    }

    if (!authRecord.passwordHash) {
        throw AuthErrors.error("auth-invalid-credentials");
    }

    const isPasswordValid = await verifyPassword(data.password, authRecord.passwordHash);
    if (!isPasswordValid) {
        throw AuthErrors.error("auth-invalid-credentials");
    }

    if (authRecord.user.userStatus !== "active") {
        throw AuthErrors.error("auth-no-session-access");
    }

    return authRecord.user;
}
