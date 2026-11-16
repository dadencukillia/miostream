import { parseCalendarDateToUtcMs } from "./time";

/**
 * Checks whether a given string is a valid IANA timezone identifier
 * (e.g., `"Europe/Kyiv"`, `"UTC"`).
 *
 * @param timezone - The timezone identifier string to validate.
 * @returns `true` if the timezone is recognized by `Intl.DateTimeFormat`, otherwise `false`.
 */
export const isValidTimezone = (timezone: string): boolean => {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

/**
 * Resolves the current calendar date in the specified IANA timezone and returns
 * its UTC midnight timestamp in milliseconds.
 *
 * @remarks
 * Uses the `"en-CA"` locale to format the current date as `YYYY-MM-DD` in the target
 * timezone. Falls back to `"UTC"` if `timezone` is not a valid IANA identifier.
 *
 * @param timezone - The target IANA timezone identifier (e.g., `"Europe/Kyiv"`).
 * @returns The UTC midnight timestamp in milliseconds representing today's date in that timezone.
 */
export const getTodayUtcMsInTimezone = (timezone: string): number => {
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