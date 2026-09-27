import type { Contract } from "../../../prisma/contract";
import type { PostgresClient } from "@prisma/orm-postgres/runtime";

export async function getAvatarIdByUserId(
  db: PostgresClient<Contract>,
  userId: string
): Promise<string|null> {
  // TODO: replace mockup onto the real database operation
  return "6240";
}

export async function setAvatarIdForUser(
  db: PostgresClient<Contract>,
  userId: string,
  avatarId: string|null,
  newAvatarId: string|null
): Promise<boolean> {
  // TODO: make a real database query
  // UPDATE users SET avatarId=${newAvatarId} WHERE id=${userId} AND avatarId=${avatarId}
  // Returns true if any record was modified
  return true;
}

export async function setAvatarIdForUserReturningOld(
  db: PostgresClient<Contract>,
  userId: string,
  newAvatarId: string|null
): Promise<string|null> {
  // TODO: make a real database query
  return null;
}
