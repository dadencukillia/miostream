import { generateTransformer } from "@utils/modelTransformer";
import { describe, expect, test } from "bun:test";

interface User {
  userId: number,
  fullName: string,
  nickname: string,
  avatarId: number|null,
  streakStartDate: Date|null,
  lastWatchDate: Date|null,
  maxStreak: number,
  timezone: string
}

const userExample: User = {
  userId: 1,
  fullName: "Jack Jackson",
  nickname: "jack",
  avatarId: 100,
  streakStartDate: new Date(),
  lastWatchDate: new Date(),
  maxStreak: 100,
  timezone: "Europe/Kyiv"
};

const modelTransformAvatar = generateTransformer({
  delete: ["avatarId"],
  map: (a: { avatarId: number|null }): { avatarUrl: string } => ({
    avatarUrl: a.avatarId ? `/cdn/avatar/${a.avatarId}.webp` : ""
  })
});

const modelTransformStreak = generateTransformer({
  delete: ["streakStartDate", "lastWatchDate", "maxStreak"],
  map: (a: { streakStartDate: Date|null, lastWatchDate: Date|null, maxStreak: number, timezone: string }): {
    streak: {
      maxDays: number,
      currentDays: number,
      isActive: boolean
    }
  } => ({
    streak: {
      maxDays: a.maxStreak,
      currentDays: 5,
      isActive: true
    }
  })
});

const modelTransformName = generateTransformer({
  map: (a: { fullName: string }): { fullName: string } => ({
    fullName: a.fullName.split(" ").reverse().join(" ")
  })
});

const modelTransformId = generateTransformer({
  delete: ["userId"], // works also without it
  map: (a: { userId: number }): { userId: string } => ({
    userId: `${a.userId}-0000-0000-0000`
  })
})

const modelTransformAll = (userModel: User) => modelTransformId(modelTransformName(modelTransformStreak(modelTransformAvatar(userModel))));

describe("modelTransformer", () => {
  test("avatar transformation", async () => {
    const transformed = modelTransformAvatar(userExample);
    expect(transformed).toEqual({
        userId: 1,
        fullName: "Jack Jackson",
        nickname: "jack",
        avatarUrl: "/cdn/avatar/100.webp",
        streakStartDate: userExample.streakStartDate,
        lastWatchDate: userExample.lastWatchDate,
        maxStreak: 100,
        timezone: "Europe/Kyiv"
    });
  });

  test("empty avatar transformation", async () => {
    const userCopy: User = { ...userExample, avatarId: null };
    const transformed = modelTransformAvatar(userCopy);
    expect(transformed).toEqual({
        userId: 1,
        fullName: "Jack Jackson",
        nickname: "jack",
        avatarUrl: "",
        streakStartDate: userExample.streakStartDate,
        lastWatchDate: userExample.lastWatchDate,
        maxStreak: 100,
        timezone: "Europe/Kyiv"
    });
  });

  test("streak transformation", async () => {
    const transformed = modelTransformStreak(userExample);
    expect(transformed).toEqual({
        userId: 1,
        fullName: "Jack Jackson",
        nickname: "jack",
        avatarId: 100,
        streak: {
          currentDays: 5,
          isActive: true,
          maxDays: 100
        },
        timezone: "Europe/Kyiv" // still here
    });
  });

  test("fullName transformation", async () => {
    const transformed = modelTransformName(userExample);
    expect(transformed).toEqual({
        userId: 1,
        fullName: "Jackson Jack", // still here!
        nickname: "jack",
        avatarId: 100,
        streakStartDate: userExample.streakStartDate,
        lastWatchDate: userExample.lastWatchDate,
        maxStreak: 100,
        timezone: "Europe/Kyiv"
    });
  });

  test("userId transformation", async () => {
    const transformed = modelTransformId(userExample);
    expect(transformed).toEqual({
        userId: "1-0000-0000-0000", // changed a type!
        fullName: "Jack Jackson",
        nickname: "jack",
        avatarId: 100,
        streakStartDate: userExample.streakStartDate,
        lastWatchDate: userExample.lastWatchDate,
        maxStreak: 100,
        timezone: "Europe/Kyiv"
    });
  });

  test("all transformations", async () => {
    const transformed = modelTransformAll(userExample);
    expect(transformed).toEqual({
      userId: "1-0000-0000-0000",
      fullName: "Jackson Jack",
      nickname: "jack",
      avatarUrl: "/cdn/avatar/100.webp",
      streak: {
        currentDays: 5,
        isActive: true,
        maxDays: 100
      },
      timezone: "Europe/Kyiv"
    })
  });
});
