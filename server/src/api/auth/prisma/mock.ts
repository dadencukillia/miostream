type MockUser = {
  id: number;
  email: string;
  name: string | null;
};

type MockGoogleRefreshToken = {
  id: number;
  userId: number;
  encryptedToken: string;
  createdAt: string;
  updatedAt: string;
};

const users: MockUser[] = [];
const googleRefreshTokens: MockGoogleRefreshToken[] = [];
let nextUserId = 1;
let nextGoogleRefreshTokenId = 1;

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
  googleRefreshToken: {
    upsert(input: { userId: number; encryptedToken: string }) {
      const existing = googleRefreshTokens.find((token) => token.userId === input.userId);
      const now = new Date().toISOString();

      if (existing) {
        existing.encryptedToken = input.encryptedToken;
        existing.updatedAt = now;
        return Promise.resolve({ ...existing });
      }

      const token = {
        id: nextGoogleRefreshTokenId++,
        userId: input.userId,
        encryptedToken: input.encryptedToken,
        createdAt: now,
        updatedAt: now,
      };
      googleRefreshTokens.push(token);
      return Promise.resolve({ ...token });
    },
  },
};

export function resetMockPrisma() {
  users.length = 0;
  googleRefreshTokens.length = 0;
  nextUserId = 1;
  nextGoogleRefreshTokenId = 1;
}