export function formatTicketNumber(n: number): string {
  return `GR-${String(n).padStart(4, "0")}`;
}
