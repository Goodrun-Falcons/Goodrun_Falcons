import { formatDistance, formatDuration } from '@/lib/route-format';

describe('formatDistance', () => {
  it('uses metres under a kilometre', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(347)).toBe('350 m');
    expect(formatDistance(994)).toBe('990 m');
  });

  it('uses kilometres with one decimal from 1 km', () => {
    expect(formatDistance(995)).toBe('1.0 km');
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(4249)).toBe('4.2 km');
  });
});

describe('formatDuration', () => {
  it('rounds to whole minutes, at least one', () => {
    expect(formatDuration(0)).toBe('~1 min');
    expect(formatDuration(89)).toBe('~1 min');
    expect(formatDuration(91)).toBe('~2 min');
  });

  it('switches to hours past 60 minutes', () => {
    expect(formatDuration(3600)).toBe('~1 h');
    expect(formatDuration(3900)).toBe('~1 h 5 min');
  });
});
