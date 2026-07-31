import type { OCRResult } from '@event-foundry/contracts';
import type { ClassificationContext } from '../classification-rule.interface';
import { normalize } from '../engine/text-utils';
import { EMPTY_SNAPSHOT, type ReferenceSnapshot } from '../reference/reference-snapshot';
import { ActivityRule } from './activity.rule';
import { DateRule } from './date.rule';
import { PriceRule } from './price.rule';
import { TimeRule } from './time.rule';
import { UrlRule } from './url.rule';

function makeContext(text: string, reference: ReferenceSnapshot = EMPTY_SNAPSHOT): ClassificationContext {
  return {
    ocr: { rawText: text } as unknown as OCRResult,
    normalizedText: normalize(text),
    reference,
    extractedFields: {},
    confidenceByField: {},
    diagnostics: [],
  };
}

describe('DateRule', () => {
  it('reconnaît une date littérale française', async () => {
    const context = makeContext('Avant-première le 12 juillet 2024 au magasin');
    await new DateRule().execute(context);
    expect(context.extractedFields.startsAt).toBe('2024-07-12T00:00:00.000Z');
    expect(context.confidenceByField.startsAt).toBe(0.9);
  });

  it('reconnaît une date numérique', async () => {
    const context = makeContext('Rendez-vous 12/07/2024');
    await new DateRule().execute(context);
    expect(context.extractedFields.startsAt).toBe('2024-07-12T00:00:00.000Z');
  });
});

describe('TimeRule', () => {
  it('complète l\'heure sur une date existante', async () => {
    const context = makeContext('Le 12 juillet 2024 à 19h30');
    await new DateRule().execute(context);
    await new TimeRule().execute(context);
    expect(context.extractedFields.startsAt).toBe('2024-07-12T19:30:00.000Z');
  });

  it('ne fait rien sans date', async () => {
    const context = makeContext('Ouverture à 19h30');
    await new TimeRule().execute(context);
    expect(context.extractedFields.startsAt).toBeUndefined();
  });
});

describe('PriceRule', () => {
  it('reconnaît un prix en euros', async () => {
    const context = makeContext('Entrée 12,50 €');
    await new PriceRule().execute(context);
    expect(context.extractedFields.price).toBe(12.5);
    expect(context.extractedFields.currency).toBe('EUR');
  });

  it('reconnaît la gratuité', async () => {
    const context = makeContext('Entrée libre pour tous');
    await new PriceRule().execute(context);
    expect(context.extractedFields.price).toBe(0);
  });
});

describe('UrlRule', () => {
  it('extrait une URL en retirant la ponctuation finale', async () => {
    const context = makeContext('Infos sur https://event.example.fr/mtg.');
    await new UrlRule().execute(context);
    expect(context.extractedFields.url).toBe('https://event.example.fr/mtg');
  });
});

describe('ActivityRule', () => {
  const reference: ReferenceSnapshot = {
    ...EMPTY_SNAPSHOT,
    activities: [{ id: 'a1', name: 'Magic', domainId: 'd1', aliases: ['MTG'] }],
  };

  it('reconnaît une activité par alias', async () => {
    const context = makeContext('Grand tournoi MTG ce samedi', reference);
    await new ActivityRule().execute(context);
    expect(context.extractedFields.activity).toBe('Magic');
    expect(context.confidenceByField.activity).toBe(0.85);
  });

  it('donne une meilleure confiance sur le nom exact', async () => {
    const context = makeContext('Tournoi Magic', reference);
    await new ActivityRule().execute(context);
    expect(context.confidenceByField.activity).toBe(0.95);
  });
});
