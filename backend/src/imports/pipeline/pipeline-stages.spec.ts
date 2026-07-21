import type { RawEvent } from '@event-foundry/contracts';
import { DeduplicateStage } from './deduplicate.stage';
import { NormalizeStage } from './normalize.stage';
import type { NormalizedEvent } from './pipeline.types';
import { ValidateStage } from './validate.stage';

function rawEvent(payload: Record<string, unknown>, id = 're-1', providerKey: string | null = null): RawEvent {
  return {
    id,
    importJobId: 'job-1',
    providerId: 'structured-file',
    providerKey,
    connectorVersion: '1.0.0',
    acquiredAt: '2026-07-21T00:00:00Z',
    payload,
    mediaRefs: [],
    correlationId: 'corr-1',
  };
}

describe('ValidateStage (cohérence minimale — RG-IMP-06)', () => {
  const stage = new ValidateStage();

  it('rejette sans titre ou sans date valide, garde les cohérents', () => {
    const { valid, rejected } = stage.validate([
      rawEvent({ title: 'OK', starts_at: '2026-08-01T18:00:00Z' }, 'a'),
      rawEvent({ starts_at: '2026-08-01T18:00:00Z' }, 'b'),
      rawEvent({ title: 'Sans date' }, 'c'),
      rawEvent({ title: 'Date pourrie', starts_at: 'pas-une-date' }, 'd'),
    ]);
    expect(valid.map((r) => r.id)).toEqual(['a']);
    expect(rejected.map((r) => r.rawEvent.id)).toEqual(['b', 'c', 'd']);
  });
});

describe('NormalizeStage (projection vers le modèle commun — ADR.15)', () => {
  const stage = new NormalizeStage();

  it('harmonise dates/nombres et projette les noms de référentiels', () => {
    const result = stage.normalize(
      rawEvent({
        title: 'Tournoi',
        starts_at: '2026-08-01T18:00:00Z',
        price: '12,50',
        event_type: 'Compétitif',
        activity: 'Magic',
        venue: 'Le Repaire',
      }),
    );
    expect(result.fields.title).toBe('Tournoi');
    expect(result.fields.startsAt).toBe('2026-08-01T18:00:00.000Z');
    expect(result.fields.price).toBe(12.5);
    expect(result.fields.eventType).toBe('Compétitif');
    expect(result.confidence.title).toBe(1);
    expect(result.signature).toContain('tournoi');
  });
});

describe('DeduplicateStage (idempotence + signature — RG-IMP)', () => {
  const stage = new DeduplicateStage();

  function normalized(over: Partial<NormalizedEvent>): NormalizedEvent {
    return {
      rawEventId: 're',
      providerId: 'structured-file',
      providerKey: null,
      fields: {},
      confidence: {},
      signature: 'sig',
      ...over,
    };
  }

  it('déduplique par providerKey au sein du lot', () => {
    const { kept, duplicates } = stage.dedupe([
      normalized({ providerKey: 'k1', signature: 's1' }),
      normalized({ providerKey: 'k1', signature: 's2' }),
    ]);
    expect(kept).toHaveLength(1);
    expect(duplicates).toHaveLength(1);
  });

  it('déduplique par signature et contre les clés déjà connues', () => {
    const known = new Set(['structured-file:kX']);
    const { kept, duplicates } = stage.dedupe(
      [
        normalized({ providerKey: 'kX', signature: 'sA' }),
        normalized({ signature: 'sB' }),
        normalized({ signature: 'sB' }),
      ],
      { keys: known },
    );
    expect(kept.map((k) => k.signature)).toEqual(['sB']);
    expect(duplicates).toHaveLength(2);
  });
});
