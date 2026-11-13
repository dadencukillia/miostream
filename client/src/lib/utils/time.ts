export function formatSpan(minutes: number): string {
  let hours = Math.floor(minutes / 60);
  minutes -= hours * 60;

  let days = Math.floor(hours / 24);
  hours -= days * 24;

  let months = Math.floor(days / 30);
  days -= months * 30;

  const formatParts = [];
  if (months !== 0) formatParts.push(Math.floor(months) + " міс");
  if (days !== 0) formatParts.push(Math.floor(days) + " д");
  if (hours !== 0) formatParts.push(Math.floor(hours) + " год");
  if (minutes !== 0) formatParts.push(Math.floor(minutes) + " хв");

  return formatParts.join(" ");
}
