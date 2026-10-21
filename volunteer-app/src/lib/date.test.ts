import { daysUntil, formatDueBy } from '@/lib/date';

const FIXED_TODAY = '2026-09-05T00:00:00';

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(FIXED_TODAY));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    expect(daysUntil('2026-09-05')).toBe(0);
  });

  it('returns 1 for tomorrow', () => {
    expect(daysUntil('2026-09-06')).toBe(1);
  });

  it('returns a positive count for a date several days out', () => {
    expect(daysUntil('2026-09-10')).toBe(5);
  });

  it('returns a negative count for a date in the past', () => {
    expect(daysUntil('2026-09-04')).toBe(-1);
  });
});

describe('formatDueBy', () => {
  it('labels today as "Due today"', () => {
    expect(formatDueBy('2026-09-05')).toBe('Due today');
  });

  it('labels an overdue date as "Due today" rather than showing a negative count', () => {
    expect(formatDueBy('2026-09-01')).toBe('Due today');
  });

  it('labels tomorrow as "Due tomorrow"', () => {
    expect(formatDueBy('2026-09-06')).toBe('Due tomorrow');
  });

  it('labels a date within the next 6 days as "Due in N days"', () => {
    expect(formatDueBy('2026-09-08')).toBe('Due in 3 days');
  });

  it('switches to a formatted date once more than 6 days away', () => {
    const farDate = '2026-09-20';
    const expected = `Due ${new Date(`${farDate}T00:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })}`;

    expect(formatDueBy(farDate)).toBe(expected);
  });
});
