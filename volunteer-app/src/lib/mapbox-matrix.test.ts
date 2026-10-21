import { buildMatrixUrl, parseMatrixDurations } from '@/lib/mapbox-matrix';

describe('buildMatrixUrl', () => {
  it('asks only for origin → each destination', () => {
    const url = buildMatrixUrl(
      { lat: -37.77, lng: 145 },
      [
        { lat: -37.8, lng: 144.97 },
        { lat: -37.75, lng: 144.96 },
      ],
      'tok'
    );
    expect(url).toBe(
      'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/145,-37.77;144.97,-37.8;144.96,-37.75' +
        '?sources=0&destinations=1;2&annotations=duration&access_token=tok'
    );
  });
});

describe('parseMatrixDurations', () => {
  it('returns the single source row, keeping unroutable entries as null', () => {
    expect(parseMatrixDurations({ code: 'Ok', durations: [[540, null, 120]] }, 3)).toEqual([
      540,
      null,
      120,
    ]);
  });

  it('returns null for errors or a row of the wrong length', () => {
    expect(parseMatrixDurations({ code: 'InvalidInput', message: 'bad' }, 1)).toBeNull();
    expect(parseMatrixDurations({ code: 'Ok', durations: [[540]] }, 2)).toBeNull();
    expect(parseMatrixDurations(null, 1)).toBeNull();
  });
});
