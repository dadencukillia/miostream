import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as credentialsService from "@/api/auth/services/credentials.service";
import * as usersSqlc from "@sqlc/users_sql";
import { getDatabasePool } from "../dbHelper";
import { wipeOAuthUsers } from "../oauthHelper";

describe("auth credentials service", () => {
    const db = getDatabasePool();
    let userId = "";

    beforeAll(async () => {
        await wipeOAuthUsers();
    });

    afterAll(async () => {
        await wipeOAuthUsers();
    });

    test("registerUser hashes password with argon2id and trims fields", async () => {
        const user = await credentialsService.registerUser(db, {
            email: "  cred_service@miostream.dev  ",
            nickname: "  cred_tester  ",
            fullName: "  Credential Tester  ",
            password: "StrongPassword123!",
        });

        userId = user.userId;

        expect(user).toMatchObject({
            email: "cred_service@miostream.dev",
            nickname: "cred_tester",
            fullName: "Credential Tester",
            userRole: "user",
            userStatus: "active",
        });

        const storedHash = await usersSqlc.getPasswordHashById(db, { userId });
        expect(storedHash?.passwordHash).toStartWith("$argon2id$");
    });

    test("loginUser authenticates by email or nickname and rejects invalid credentials", async () => {
        const byEmail = await credentialsService.loginUser(db, {
            identifier: "CRED_SERVICE@MIOSTREAM.DEV",
            password: "StrongPassword123!",
        });
        expect(byEmail.userId).toBe(userId);

        const byNickname = await credentialsService.loginUser(db, {
            identifier: "cred_tester",
            password: "StrongPassword123!",
        });
        expect(byNickname.userId).toBe(userId);

        await expect(
            credentialsService.loginUser(db, {
                identifier: "cred_tester",
                password: "WrongPassword123!",
            })
        ).rejects.toMatchObject({ statusCode: 401, slug: "auth-invalid-credentials" });
    });

    test("updateUserPassword updates hash and rejects identical or wrong old password", async () => {
        await expect(
            credentialsService.updateUserPassword(db, userId, {
                oldPassword: "StrongPassword123!",
                newPassword: "StrongPassword123!",
            })
        ).rejects.toMatchObject({ statusCode: 400, slug: "user-invalid" });

        await credentialsService.updateUserPassword(db, userId, {
            oldPassword: "StrongPassword123!",
            newPassword: "NewStrongPassword789!",
        });

        const updatedHash = await usersSqlc.getPasswordHashById(db, { userId });
        expect(updatedHash?.passwordHash).toStartWith("$argon2id$");

        const loggedIn = await credentialsService.loginUser(db, {
            identifier: "cred_tester",
            password: "NewStrongPassword789!",
        });
        expect(loggedIn.userId).toBe(userId);
    });
});
