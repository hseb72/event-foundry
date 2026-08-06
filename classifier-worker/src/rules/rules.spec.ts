import type { OCRResult } from '@event-foundry/contracts';
import type { ClassificationContext } from '../classification-rule.interface';
import { normalize } from '../engine/text-utils';
import { EMPTY_SNAPSHOT, type ReferenceSnapshot } from '../reference/reference-snapshot';
import { ActivityFromSubjectRule } from './activity-from-subject.rule';
import { ActivityRule } from './activity.rule';
import { EventTypeRule } from './event-type.rule';
import { OrganizerRule } from './organizer.rule';
import { VenueRule } from './venue.rule';
import { SubjectRule } from './subject.rule';
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

describe('Axe A — reconnaissance du sujet puis déduction de l’activité (DATA.01 v2.0)', () => {
  // Hiérarchie réelle du référentiel généraliste : l'affiche nomme le sujet, jamais l'activité.
  const reference: ReferenceSnapshot = {
    ...EMPTY_SNAPSHOT,
    activities: [
      { id: 'act-jeux', name: 'Jeux', domainId: 'dom-1', aliases: [] },
      { id: 'act-musique', name: 'Musique', domainId: 'dom-2', aliases: [] },
    ],
    families: [
      { id: 'fam-tcg', name: 'TCG', activityId: 'act-jeux' },
      { id: 'fam-plateau', name: 'Jeu de plateau', activityId: 'act-jeux' },
      { id: 'fam-amplifiees', name: 'Musiques amplifiées', activityId: 'act-musique' },
    ],
    subjects: [
      // « MTG » et « D&D » : ce qu'une affiche écrit réellement, jamais le nom complet.
      { id: 'sub-magic', name: 'Magic', familyId: 'fam-tcg', aliases: ['MTG'] },
      { id: 'sub-pokemon', name: 'Pokémon', familyId: 'fam-tcg', aliases: [] },
      { id: 'sub-catane', name: 'Catane', familyId: 'fam-plateau', aliases: [] },
      { id: 'sub-rock', name: 'Rock', familyId: 'fam-amplifiees', aliases: [] },
    ],
    eventTypes: [{ id: 'et-1', name: 'Tournoi', aliases: ['tournament'] }],
  };

  const run = async (text: string): Promise<ClassificationContext> => {
    const context = makeContext(text, reference);
    await new ActivityRule().execute(context);
    await new EventTypeRule().execute(context);
    await new SubjectRule().execute(context);
    await new ActivityFromSubjectRule().execute(context);
    return context;
  };

  it('déduit l’activité du sujet reconnu (« Tournoi Magic » → Jeux)', async () => {
    const context = await run('Grand tournoi Magic le samedi 12 juillet');
    expect(context.extractedFields.subjects).toEqual(['Magic']);
    expect(context.extractedFields.eventType).toBe('Tournoi');
    expect(context.extractedFields.activity).toBe('Jeux');
    // Déduite : moins sûre qu'une activité littéralement présente dans le texte.
    expect(context.confidenceByField.activity).toBe(0.75);
  });

  it('reconnaît le sujet malgré un retour à la ligne de l’OCR et un pluriel', async () => {
    const context = await run('Deux tournois\nPokemon dimanche');
    expect(context.extractedFields.eventType).toBe('Tournoi');
    expect(context.extractedFields.subjects).toEqual(['Pokémon']);
    expect(context.extractedFields.activity).toBe('Jeux');
  });

  it('ne signale pas d’ambiguïté quand plusieurs sujets partagent la même activité', async () => {
    const context = await run('Tournois Magic et Catane');
    expect(context.extractedFields.subjects).toEqual(['Magic', 'Catane']);
    expect(context.extractedFields.activity).toBe('Jeux');
    expect(context.diagnostics.filter((d) => d.level === 'WARNING')).toHaveLength(0);
  });

  it('avertit quand les sujets relèvent d’activités différentes', async () => {
    const context = await run('Soirée Magic puis concert Rock');
    expect(context.extractedFields.activity).toBe('Jeux');
    expect(context.diagnostics).toContainEqual(
      expect.objectContaining({ level: 'WARNING', field: 'activity' }),
    );
  });

  it('n’écrase jamais une activité littéralement présente dans le texte', async () => {
    const context = await run('Soirée Jeux : concert Rock en fond sonore');
    expect(context.extractedFields.activity).toBe('Jeux');
    expect(context.confidenceByField.activity).toBe(0.95);
  });

  it('ne déduit rien sans sujet reconnu', async () => {
    const context = await run('Grande brocante du village');
    expect(context.extractedFields.activity).toBeUndefined();
  });
});

describe('Alias multi-référentiels : ce qu’une affiche écrit vraiment', () => {
  const reference: ReferenceSnapshot = {
    ...EMPTY_SNAPSHOT,
    activities: [{ id: 'act-jeux', name: 'Jeux', domainId: 'dom-1', aliases: [] }],
    families: [{ id: 'fam-tcg', name: 'TCG', activityId: 'act-jeux' }],
    subjects: [
      { id: 'sub-magic', name: 'Magic', familyId: 'fam-tcg', aliases: ['MTG'] },
      { id: 'sub-dd', name: 'Donjons & Dragons', familyId: 'fam-tcg', aliases: ['D&D', 'DnD'] },
    ],
    eventTypes: [{ id: 'et-1', name: 'Avant-première', aliases: ['AP'] }],
    organizers: [{ id: 'org-1', name: 'Association Ludique Nantaise', aliases: ['ALN'] }],
    venues: [{ id: 'ven-1', name: 'Salle Jean Moulin', city: 'Nantes', aliases: ['SJM'] }],
  };

  it('reconnaît un sujet par son sigle et en déduit l’activité', async () => {
    const context = makeContext('Tournoi MTG samedi', reference);
    await new ActivityRule().execute(context);
    await new SubjectRule().execute(context);
    await new ActivityFromSubjectRule().execute(context);

    expect(context.extractedFields.subjects).toEqual(['Magic']);
    // Reconnu par abréviation : moins sûr qu'un sujet nommé explicitement.
    expect(context.confidenceByField.subjects).toBe(0.75);
    expect(context.extractedFields.activity).toBe('Jeux');
  });

  it('ne fait pas remonter deux fois un sujet cité par son nom et par son alias', async () => {
    const context = makeContext('Soirée Magic (MTG) ce vendredi', reference);
    await new SubjectRule().execute(context);

    expect(context.extractedFields.subjects).toEqual(['Magic']);
    expect(context.confidenceByField.subjects).toBe(0.85);
  });

  it('reconnaît un alias ponctué (« D&D »)', async () => {
    const context = makeContext('Table de D&D ouverte à tous', reference);
    await new SubjectRule().execute(context);
    expect(context.extractedFields.subjects).toEqual(['Donjons & Dragons']);
  });

  it('reconnaît un type, un organisateur et un lieu par leur sigle', async () => {
    const context = makeContext('AP organisée par l’ALN à la SJM', reference);
    await new EventTypeRule().execute(context);
    await new OrganizerRule().execute(context);
    await new VenueRule().execute(context);

    expect(context.extractedFields.eventType).toBe('Avant-première');
    expect(context.extractedFields.organizer).toBe('Association Ludique Nantaise');
    expect(context.extractedFields.venue).toBe('Salle Jean Moulin');
    expect(context.extractedFields.city).toBe('Nantes');
    // Un sigle est moins sûr qu'un nom complet.
    expect(context.confidenceByField.eventType).toBe(0.7);
    expect(context.confidenceByField.venue).toBe(0.6);
  });

  it('privilégie le nom sur l’alias quand les deux sont présents', async () => {
    const context = makeContext('Avant-première à la Salle Jean Moulin', reference);
    await new EventTypeRule().execute(context);
    await new VenueRule().execute(context);
    expect(context.confidenceByField.eventType).toBe(0.8);
    expect(context.confidenceByField.venue).toBe(0.7);
  });
});
