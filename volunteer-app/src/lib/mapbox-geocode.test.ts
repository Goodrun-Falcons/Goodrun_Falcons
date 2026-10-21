import { buildReverseGeocodeUrl, parseAddress } from '@/lib/mapbox-geocode';

describe('buildReverseGeocodeUrl', () => {
  it('puts longitude and latitude in the right params', () => {
    expect(buildReverseGeocodeUrl({ lat: -37.8, lng: 144.97 }, 'tok')).toBe(
      'https://api.mapbox.com/search/geocode/v6/reverse?longitude=144.97&latitude=-37.8&limit=1&access_token=tok'
    );
  });
});

describe('parseAddress', () => {
  it('uses the full address without the country', () => {
    const body = {
      features: [
        {
          properties: {
            full_address: '12 Smith St, Fitzroy VIC 3065, Australia',
            context: { country: { name: 'Australia' } },
          },
        },
      ],
    };
    expect(parseAddress(body)).toBe('12 Smith St, Fitzroy VIC 3065');
  });

  it('falls back to name + place when there is no full address', () => {
    const body = {
      features: [{ properties: { name: 'Fitzroy', place_formatted: 'VIC, Australia' } }],
    };
    expect(parseAddress(body)).toBe('Fitzroy, VIC, Australia');
  });

  it('returns null for no match or an error body', () => {
    expect(parseAddress({ features: [] })).toBeNull();
    expect(parseAddress({ message: 'Not Authorized' })).toBeNull();
    expect(parseAddress(null)).toBeNull();
  });
});
