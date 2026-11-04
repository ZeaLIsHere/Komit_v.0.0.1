/**
 * Truncate a given date to the Monday 00:00:00.000 UTC of its week.
 */
export function truncateToWeek(date: Date): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;

  d.setUTCDate(d.getUTCDate() - diffToMonday);
  d.setUTCHours(0, 0, 0, 0);

  return d;
}
