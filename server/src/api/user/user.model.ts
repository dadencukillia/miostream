import { generateTransformer } from "@utils/modelTransformer";

const MS_PER_DAY = 86_400_000;

function parseCalendarDateToUtcMs(value: string | Date): number | null {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return Date.UTC(year, month - 1, day);
}

function getTodayUtcMsInTimezone(timezone: string): number {
    let formatted: string;
    try {
        formatted = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());
    } catch {
        formatted = new Intl.DateTimeFormat("en-CA", {
            timeZone: "UTC",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());
    }

    return parseCalendarDateToUtcMs(formatted)!;
}

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