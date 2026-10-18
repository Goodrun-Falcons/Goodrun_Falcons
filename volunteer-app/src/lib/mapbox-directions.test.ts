import { buildDirectionsUrl, parseDirectionsResponse } from '@/lib/mapbox-directions';

describe('buildDirectionsUrl', () => {
  it('lists points as lng,lat in order', () => {
    const url = buildDirectionsUrl(
      [
        { lat: -37.77, lng: 145 },
        { lat: -37.8, lng: 144.97 },
      ],
      'tok'
    );
    expect(url).toBe(
      'https://api.mapbox.com/directions/v5/mapbox/driving/145,-37.77;144.97,-37.8' +
        '?geometries=geojson&overview=full&access_token=tok'
    );
  });
});

describe('parseDirectionsResponse', () => {
  it('reads the first route', () => {
    const route = parseDirectionsResponse({
      code: 'Ok',
      routes: [
        {
          geometry: {
            coordinates: [
              [145, -37.77],
              [144.97, -37.8],
            ],
          },
          distance: 4200,
          duration: 540,
          legs: [{ distance: 4200, duration: 540 }],
        },
      ],
    });
    expect(route).toEqual({
      geometry: [
        [145, -37.77],
        [144.97, -37.8],
      ],
      distanceM: 4200,
      durationS: 540,
      legs: [{ distanceM: 4200, durationS: 540 }],
    });
  });

  it('returns null when there is no route', () => {
    expect(parseDirectionsResponse({ code: 'NoRoute', routes: [] })).toBeNull();
    expect(parseDirectionsResponse({ message: 'Not Authorized - Invalid Token' })).toBeNull();
    expect(parseDirectionsResponse(null)).toBeNull();
  });
});
