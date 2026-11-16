import { getTodayUtcMsInTimezone } from "@utils/timezones";
import { generateTransformer } from "@utils/modelTransformer";
import { MS_PER_DAY, parseCalendarDateToUtcMs } from "@utils/time";

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

export const toUserModel = generateTransformer({
    delete: ["streakStartDate", "lastWatchDate"],
    map: (user: {
        streakStartDate: string | Date | null;
        lastWatchDate: string | Date | null;
        timezone: string;
    }) => ({
        ok: true as const,
        streak: calculateUserStreak(user.streakStartDate, user.lastWatchDate, user.timezone),
    }),
});

export const toPublicUserModel = generateTransformer({
    delete: ["email"],
    map: (_user: { email: string }) => ({}),
});

export const toUserWithoutOldAvatarModel = generateTransformer({
    delete: ["oldAvatarId"],
    map: (_row: { oldAvatarId: string | null }) => ({}),
});

export const toUserLinkModel = generateTransformer({
    delete: [],
    map: (_link: { userLinkId: string | number; userId: string; userLinkUrl: string }) => ({
        ok: true as const,
    }),
});
