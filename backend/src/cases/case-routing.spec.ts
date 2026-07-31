import { CasePriority, CaseStatus } from '@prisma/client';
import { decideRouting, matches, type RoutingRuleDef } from './case-routing';

describe('case-routing — moteur de règles (FSPEC.21 §14)', () => {
  const ctx = {
    type: 'SUPPORT_REQUEST',
    origin: 'ORGANIZER',
    organizationId: 'org-1',
    eventId: null,
    aiConfidence: null,
    priority: null,
  };

  describe('matches', () => {
    it('ET logique : toutes les conditions présentes doivent matcher', () => {
      expect(matches({ types: ['SUPPORT_REQUEST'], origins: ['ORGANIZER'] }, ctx)).toBe(true);
      expect(matches({ types: ['SUPPORT_REQUEST'], origins: ['EXPLORER'] }, ctx)).toBe(false);
      expect(matches({ organizationId: 'org-2' }, ctx)).toBe(false);
      expect(matches({ requiresEvent: true }, ctx)).toBe(false);
    });

    it('seuil de confiance IA', () => {
      expect(matches({ aiConfidenceBelow: 0.5 }, { ...ctx, aiConfidence: 0.3 })).toBe(true);
      expect(matches({ aiConfidenceBelow: 0.5 }, { ...ctx, aiConfidence: 0.8 })).toBe(false);
      expect(matches({ aiConfidenceBelow: 0.5 }, ctx)).toBe(false); // pas de confiance → non applicable
    });
  });

  describe('decideRouting', () => {
    const rules: RoutingRuleDef[] = [
      {
        id: 'r-late',
        name: 'Générale support',
        orderIndex: 20,
        criteria: { types: ['SUPPORT_REQUEST'] },
        result: { domain: 'FRONTEND_SUPPORT' },
      },
      {
        id: 'r-early',
        name: 'Support VIP org-1',
        orderIndex: 10,
        criteria: { types: ['SUPPORT_REQUEST'], organizationId: 'org-1' },
        result: { domain: 'BACKEND_SUPPORT', priority: CasePriority.HIGH, initialStatus: CaseStatus.ASSIGNED, defaultAssigneeId: 'op-9' },
      },
    ];

    it('première règle applicable (ordre croissant) gagne', () => {
      const decision = decideRouting(rules, ctx);
      expect(decision.matchedRuleId).toBe('r-early');
      expect(decision.domain).toBe('BACKEND_SUPPORT');
      expect(decision.workQueue).toBe('BACKEND_SUPPORT_QUEUE');
      expect(decision.priority).toBe(CasePriority.HIGH);
      expect(decision.initialStatus).toBe(CaseStatus.ASSIGNED);
      expect(decision.defaultAssigneeId).toBe('op-9');
    });

    it('aucune règle applicable → repli sur le catalogue déterministe (CASE-012)', () => {
      const decision = decideRouting(rules, { ...ctx, type: 'GDPR_REQUEST', organizationId: null });
      expect(decision.matchedRuleId).toBeNull();
      expect(decision.domain).toBe('COMPLIANCE');
      expect(decision.initialStatus).toBe(CaseStatus.NEW);
    });

    it('sans aucune règle → repli catalogue', () => {
      const decision = decideRouting([], { ...ctx, type: 'CONTENT_REPORT' });
      expect(decision.domain).toBe('MODERATION');
      expect(decision.priority).toBe(CasePriority.HIGH);
    });
  });
});
