export const MS_PER_DAY = 86_400_000;

/**
 * Formats a given `Date` object into localized date and time string components (`DD.MM.YYYY` and `HH:mm:ss`).
 * 
 * @param time - The `Date` object to format.
 * @returns An object containing the padded `dateFormat` (DD.MM.YYYY) and `timeFormat` (HH:mm:ss).
 */
export const formatDate = (time: Date): {
  dateFormat: string,
  timeFormat: string
} => {
  const dateFormat = time.getDate().toString().padStart(2, "0") + "." +
    (time.getMonth() + 1).toString().padStart(2, "0") + "." +
    time.getFullYear();

  const timeFormat = time.getHours().toString().padStart(2, "0") + ":" +
    time.getMinutes().toString().padStart(2, "0") + ":" +
    time.getSeconds().toString().padStart(2, "0");

  return { dateFormat, timeFormat };
}

/**
 * Normalizes a `Date` instance or a `YYYY-MM-DD` calendar date string to
 * midnight UTC (`00:00:00.000Z`) in milliseconds since the Unix epoch.
 *
 * @remarks
 * For `Date` objects, local calendar components (`getFullYear`, `getMonth`, `getDate`)
 * are extracted before constructing the UTC timestamp. For strings, only the leading
 * `YYYY-MM-DD` prefix is parsed.
 *
 * @param value - A `Date` object or a date string starting with `YYYY-MM-DD`.
 * @returns The UTC midnight timestamp in milliseconds, or `null` if the input is invalid or unparseable.
 */
export const parseCalendarDateToUtcMs = (value: string | Date): number | null => {
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
