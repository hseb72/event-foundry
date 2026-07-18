import { computeDateRange } from './date-range.util';

describe('computeDateRange', () => {
  // 2024-07-17 est un mercredi (2024-07-01 est un lundi).
  const now = new Date('2024-07-17T10:00:00.000Z');

  it('par défaut retourne les événements à venir', () => {
    const range = computeDateRange({ now });
    expect(range.startsFrom).toEqual(now);
    expect(range.startsTo).toBeUndefined();
  });

  it('gère « today » sur la journée UTC', () => {
    const range = computeDateRange({ period: 'today', now });
    expect(range.startsFrom?.toISOString()).toBe('2024-07-17T00:00:00.000Z');
    expect(range.startsTo?.toISOString()).toBe('2024-07-17T23:59:59.999Z');
  });

  it('gère « this-week » à partir du lundi', () => {
    const range = computeDateRange({ period: 'this-week', now });
    expect(range.startsFrom?.toISOString()).toBe('2024-07-15T00:00:00.000Z');
    expect(range.startsTo?.toISOString()).toBe('2024-07-21T23:59:59.999Z');
  });

  it('gère « next-7-days » depuis maintenant', () => {
    const range = computeDateRange({ period: 'next-7-days', now });
    expect(range.startsFrom).toEqual(now);
    expect(range.startsTo?.toISOString()).toBe('2024-07-24T10:00:00.000Z');
  });

  it('gère une période personnalisée', () => {
    const range = computeDateRange({ from: '2024-08-01T00:00:00.000Z', to: '2024-08-31T00:00:00.000Z', now });
    expect(range.startsFrom?.toISOString()).toBe('2024-08-01T00:00:00.000Z');
    expect(range.startsTo?.toISOString()).toBe('2024-08-31T00:00:00.000Z');
  });
});
