const pad = (n: number) => String(n).padStart(2, '0');

/** Formats a date (Date or epoch millis) as DD-MM-YYYY for display. */
export function formatDueDate(value: Date | number): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function buildLocalDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  // Reject roll-overs like 31-02-2026 → 03-03-2026.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

/** Parses a strict DD-MM-YYYY string into a local-midnight Date, or null if invalid. */
export function parseDueDate(input: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(input.trim());
  if (!match) return null;
  return buildLocalDate(Number(match[3]), Number(match[2]), Number(match[1]));
}

/**
 * Legacy requests stored proposedDueDate as a 'YYYY-MM-DD' string before it
 * became a Firestore Timestamp; converts either form to epoch millis.
 */
export function dueDateMillisFromFirestore(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    const date = match ? buildLocalDate(Number(match[1]), Number(match[2]), Number(match[3])) : null;
    return date ? date.getTime() : null;
  }
  return null;
}

/** Local midnight today — the earliest selectable due date. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** List timestamps: "09:23" today, "Yesterday", otherwise DD-MM-YYYY. */
export function formatActivityTime(millis: number, now = new Date()): string {
  const date = new Date(millis);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (date >= today) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (date >= yesterday) return 'Yesterday';
  return formatDueDate(date);
}
