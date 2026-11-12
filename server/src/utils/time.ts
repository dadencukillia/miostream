export const formatDate = (time: Date): {
  dateFormat: string,
  timeFormat: string
} => {
  const dateFormat = time.getDate().toString().padStart(2, "0") + "." +
    time.getMonth().toString().padStart(2, "0") + "." +
    time.getFullYear();

  const timeFormat = time.getHours().toString().padStart(2, "0") + ":" +
    time.getMinutes().toString().padStart(2, "0") + ":" +
    time.getSeconds().toString().padStart(2, "0");

  return { dateFormat, timeFormat };
}
