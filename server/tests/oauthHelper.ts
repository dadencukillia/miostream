import { getDatabasePool, wipeDatabaseTables } from "./dbHelper";
import { Client, Pool } from "pg";
import { faker } from "@faker-js/faker";
import { extractSessionToken, generateAccessToken, newUserSessionClient } from "@/api/auth/auth.service";
import { getSessionById, GetSessionByIdRow } from "@sqlc/sessions_sql";
import { getUserById, GetUserByIdRow } from "@sqlc/users_sql";

const pool = getDatabasePool();

export async function newTestUser(db: Pool|Client, nickname: string, fullName: string, email: string, googleId: string, role: string, status: string): Promise<string> {
  const userId = await db.query<{ user_id: string }>(
    `INSERT INTO public.users(nickname, full_name, email, google_id, user_role, user_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id;`,
    [ nickname, fullName, email, googleId, role, status ]
  );

  if (!userId.rows[0]) throw Error("helper: user not created");

  return userId.rows[0].user_id;
}

export async function randomTestUser(db: Pool|Client, role: string, status: string): Promise<string> {
  return newTestUser(db, faker.internet.username(), faker.person.fullName(), faker.internet.email(), faker.string.alphanumeric(16), role, status);
}

export async function newTestSessionToken(role: string, status: string): Promise<string> {
  const con = await pool.connect();
  try {
    await con.query("BEGIN;");
    const userId = await randomTestUser(con, role, status);
    const { sessionToken } = await newUserSessionClient(con, userId);
    await con.query("COMMIT;");
    return sessionToken;
  } catch(e) {
    await con.query("ROLLBACK;").catch(_ => {});
    throw e;
  } finally {
    con.release();
  }
}

export async function tokenSession(db: Pool|Client, sessionToken: string): Promise<GetSessionByIdRow> {
  const { sessionId } = extractSessionToken(sessionToken);
  const session = await getSessionById(db, { sessionId: sessionId.toString() });
  if (!session) throw Error("helper: no session");
  return session;
}

export async function tokenUser(db: Pool|Client, sessionToken: string): Promise<GetUserByIdRow> {
  const { userId } = await tokenSession(db, sessionToken);
  const user = await getUserById(db, { userId });
  if (!user) throw Error("helper: no user");
  return user;
}

export async function newTestAuth(role: string, status: string): Promise<{
  user: GetUserByIdRow,
  session: GetSessionByIdRow,
  sessionToken: string,
  accessToken: string,
  authorization: string
}> {
  const sessionToken = await newTestSessionToken(role, status);
  const session = await tokenSession(getDatabasePool(), sessionToken);
  const user = await getUserById(getDatabasePool(), { userId: session.userId });
  if (!user) throw Error("helper: no user");
  const accessToken = await generateAccessToken(BigInt(session.sessionId), user.userId);
  return {
    user, session, sessionToken, accessToken,
    authorization: `Bearer ${ accessToken }`
  };
}

export const wipeOAuthUsers = () => wipeDatabaseTables("public.sessions", "public.users");
