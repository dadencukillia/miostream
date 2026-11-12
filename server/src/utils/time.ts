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
