import { getTodayUtcMsInTimezone } from "@utils/timezones";
import { generateTransformer } from "@lib/modelTransformer";
import { MS_PER_DAY, parseCalendarDateToUtcMs } from "@utils/time";
import { Plain } from "@utils/types";

export function calculateUserStreak(
    streakStartDate: string | Date | null,
    lastWatchDate: string | Date | null,
    timezone: string = "UTC"
): number {
    if (streakStartDate == null || lastWatchDate == null) {
        return 0;
    }

    const startUtcMs = parseCalendarDateToUtcMs(streakStartDate);
    const lastUtcMs = parseCalendarDateToUtcMs(lastWatchDate);
    if (startUtcMs === null || lastUtcMs === null || lastUtcMs < startUtcMs) {
        return 0;
    }

    const todayUtcMs = getTodayUtcMsInTimezone(timezone);
    const daysSinceLastWatch = Math.round((todayUtcMs - lastUtcMs) / MS_PER_DAY);
    if (daysSinceLastWatch > 1) {
        return 0;
    }

    return Math.round((lastUtcMs - startUtcMs) / MS_PER_DAY) + 1;
}

// Streak Transformation

export interface UserTransformStreakInput {
    streakStartDate: string | Date | null;
    lastWatchDate: string | Date | null;
    timezone: string;
}

export interface UserTransformStreakOutput {
    streak: number;
}

export const userTransformStreak = generateTransformer({
    delete: ["streakStartDate", "lastWatchDate"],
    map: (user: Plain<UserTransformStreakInput>): Plain<UserTransformStreakOutput> => ({
        streak: calculateUserStreak(user.streakStartDate, user.lastWatchDate, user.timezone),
    }),
});

// Public User Transformation

export interface UserTransformPublicInput {
    email: string;
}

export interface UserTransformPublicOutput { }

export const userTransformPublic = generateTransformer({
    delete: ["email"],
    map: (_user: Plain<UserTransformPublicInput>): Plain<UserTransformPublicOutput> => ({}),
});

// Old Avatar Cleanup Transformation

export interface UserTransformOldAvatarInput {
    oldAvatarId: string | null;
}

export interface UserTransformOldAvatarOutput { }

export const userTransformOldAvatar = generateTransformer({
    delete: ["oldAvatarId"],
    map: (_row: Plain<UserTransformOldAvatarInput>): Plain<UserTransformOldAvatarOutput> => ({}),
});

// Avatar URL Transformation

export interface UserTransformAvatarUrlInput {
    avatarId: string | null;
}

export interface UserTransformAvatarUrlOutput {
    avatarUrl: string | null;
}

export const userTransformAvatarUrl = generateTransformer({
    delete: ["avatarId"],
    map: (user: Plain<UserTransformAvatarUrlInput>): Plain<UserTransformAvatarUrlOutput> => ({
        avatarUrl: user.avatarId ? `/cdn/avatar/${user.avatarId}.webp` : null,
    }),
});