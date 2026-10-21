import { apiErrorFromBody } from '@/lib/api';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-secure-store', () => ({}));

describe('apiErrorFromBody', () => {
  it('reads a plain string error', () => {
    const e = apiErrorFromBody(409, { error: 'Request is no longer available' });
    expect([e.status, e.code, e.message]).toEqual([
      409,
      'Request is no longer available',
      'Request is no longer available',
    ]);
  });

  it('prefers a separate message when there is one', () => {
    const e = apiErrorFromBody(409, { error: 'PHOTO_REQUIRED', message: 'Add a photo.' });
    expect([e.code, e.message]).toEqual(['PHOTO_REQUIRED', 'Add a photo.']);
  });

  it('unpacks a Supabase error object under `error`', () => {
    const e = apiErrorFromBody(500, { error: { code: '23514', message: 'violates check' } });
    expect([e.code, e.message]).toEqual(['23514', 'violates check']);
  });

  it('unpacks a Supabase error object under `message`', () => {
    const e = apiErrorFromBody(500, {
      message: { code: '42501', message: 'new row violates row-level security policy' },
    });
    expect([e.code, e.message]).toEqual(['42501', 'new row violates row-level security policy']);
  });

  it('falls back when the body says nothing useful', () => {
    for (const body of [null, {}, { error: null }]) {
      const e = apiErrorFromBody(500, body);
      expect([e.code, e.message]).toEqual(['UNKNOWN_ERROR', 'UNKNOWN_ERROR']);
    }
  });
});
