type MockUser = {
  id: number;
  email: string;
  name: string | null;
};

type MockAuthSession = {
  id: string;
  userId: number;
  refreshToken: string;
  expiresAt: string;
};

const users: MockUser[] = [];
const authSessions: MockAuthSession[] = [];
let nextUserId = 1;

export const mockPrisma = {
  user: {
    findUnique(input: { where: { email?: string; id?: number } }) {
      const user = users.find(
        (u) =>
          (input.where.email && u.email === input.where.email) ||
          (input.where.id && u.id === input.where.id)
      );
      return Promise.resolve(user ? { ...user } : null);
    },

    upsert(input: { conflictOn: { email: string }; create: { email: string; name: string | null }; update: { name: string | null } }) {
      const existing = users.find((user) => user.email === input.conflictOn.email);
      if (existing) {
        existing.name = input.update.name;
        return Promise.resolve({ ...existing });
      }
      const user = { id: nextUserId++, ...input.create };
      users.push(user);
      return Promise.resolve({ ...user });
    },
  },
  authSession: {
    create(input: MockAuthSession) {
      authSessions.push({ ...input });
      return Promise.resolve({ ...input });
    },
    where(input: { id: string }) {
      return {
        first: () => Promise.resolve(authSessions.find((session) => session.id === input.id) ?? null),
      };
    },
  },
};

export function resetMockPrisma() {
  users.length = 0;
  authSessions.length = 0;
  nextUserId = 1;
}