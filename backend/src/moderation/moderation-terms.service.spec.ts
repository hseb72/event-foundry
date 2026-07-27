import { ModerationTermKind } from '@prisma/client';
import type { ModerationTermsRepository } from './moderation-terms.repository';
import { ModerationTermsService } from './moderation-terms.service';

describe('ModerationTermsService.firstMatch (FSPEC.22 §13 — détection déterministe)', () => {
  const withTerms = (terms: { term: string; kind: ModerationTermKind }[]) => {
    const repository = {
      listActive: jest.fn().mockResolvedValue(terms.map((t, i) => ({ id: String(i), isActive: true, ...t }))),
    };
    return new ModerationTermsService(repository as unknown as ModerationTermsRepository);
  };

  it('détecte un terme interdit sur frontière de mot (insensible casse/accents)', async () => {
    const service = withTerms([{ term: 'Arnaque', kind: ModerationTermKind.BANNED }]);
    await expect(service.firstMatch('Grosse arnaqué à ne pas rater')).resolves.toEqual({
      term: 'Arnaque',
      kind: ModerationTermKind.BANNED,
    });
  });

  it('ne déclenche pas sur une correspondance interne à un mot', async () => {
    const service = withTerms([{ term: 'arme', kind: ModerationTermKind.BANNED }]);
    await expect(service.firstMatch('Championnat de charme')).resolves.toBeNull();
  });

  it('BANNED est prioritaire sur SPAM', async () => {
    const service = withTerms([
      { term: 'promo', kind: ModerationTermKind.SPAM },
      { term: 'interdit', kind: ModerationTermKind.BANNED },
    ]);
    await expect(service.firstMatch('promo interdit')).resolves.toEqual({
      term: 'interdit',
      kind: ModerationTermKind.BANNED,
    });
  });

  it('aucun terme configuré → aucune détection', async () => {
    const service = withTerms([]);
    await expect(service.firstMatch("N'importe quel contenu")).resolves.toBeNull();
  });
});
