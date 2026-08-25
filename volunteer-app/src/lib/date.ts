/** Whole days between today and an ISO (yyyy-mm-dd) date. Negative if the date is in the past. */
export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDueBy(dueBy: string): string {
  const daysLeft = daysUntil(dueBy);

  if (daysLeft <= 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  if (daysLeft <= 6) return `Due in ${daysLeft} days`;
  return `Due ${new Date(`${dueBy}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
}
