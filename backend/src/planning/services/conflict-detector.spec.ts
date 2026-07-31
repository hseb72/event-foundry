import { detectConflicts, slotsOverlap } from './conflict-detector';

const slot = (id: string, start: string, end?: string) => ({
  id,
  startsAt: new Date(start),
  endsAt: end ? new Date(end) : null,
});

describe('conflict-detector', () => {
  it('détecte un chevauchement d’intervalles', () => {
    const a = slot('a', '2026-09-01T10:00:00Z', '2026-09-01T12:00:00Z');
    const b = slot('b', '2026-09-01T11:00:00Z', '2026-09-01T13:00:00Z');
    expect(slotsOverlap(a, b)).toBe(true);
  });

  it('ne signale pas deux événements disjoints', () => {
    const a = slot('a', '2026-09-01T10:00:00Z', '2026-09-01T11:00:00Z');
    const b = slot('b', '2026-09-01T11:00:00Z', '2026-09-01T12:00:00Z');
    expect(slotsOverlap(a, b)).toBe(false);
  });

  it('signale un même horaire de début (doublon) même sans date de fin', () => {
    const a = slot('a', '2026-09-01T10:00:00Z');
    const b = slot('b', '2026-09-01T10:00:00Z');
    expect(slotsOverlap(a, b)).toBe(true);
  });

  it('construit la carte symétrique des conflits', () => {
    const map = detectConflicts([
      slot('a', '2026-09-01T10:00:00Z', '2026-09-01T12:00:00Z'),
      slot('b', '2026-09-01T11:00:00Z', '2026-09-01T13:00:00Z'),
      slot('c', '2026-09-02T10:00:00Z', '2026-09-02T11:00:00Z'),
    ]);
    expect(map.get('a')).toEqual(['b']);
    expect(map.get('b')).toEqual(['a']);
    expect(map.has('c')).toBe(false);
  });
});
