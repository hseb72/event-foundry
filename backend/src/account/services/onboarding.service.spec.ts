import { NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { AccountRepository } from '../repositories/account.repository';
import { computeOnboarding, OnboardingService } from './onboarding.service';
import type { SecurityAuditService } from './security-audit.service';

describe('OnboardingService (FSPEC.16/17)', () => {
  let repository: { findUserById: jest.Mock; acceptTerms: jest.Mock };
  let audit: { record: jest.Mock };
  let service: OnboardingService;

  beforeEach(() => {
    repository = { findUserById: jest.fn(), acceptTerms: jest.fn() };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new OnboardingService(
      repository as unknown as AccountRepository,
      audit as unknown as SecurityAuditService,
    );
  });

  describe('computeOnboarding', () => {
    it('niveau 0 quand rien n’est fait', () => {
      expect(computeOnboarding(null, null)).toMatchObject({ level: 0, completed: false });
    });
    it('niveau 0.5 quand une étape sur deux est faite', () => {
      expect(computeOnboarding(new Date(), null).level).toBe(0.5);
    });
    it('complété quand e-mail vérifié + CGU acceptées', () => {
      expect(computeOnboarding(new Date(), new Date())).toMatchObject({ level: 1, completed: true });
    });
  });

  it('get : compte inconnu → 404', async () => {
    repository.findUserById.mockResolvedValue(null);
    await expect(service.get('u-x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('acceptTerms : marque + audite + renvoie l’état à jour', async () => {
    repository.acceptTerms.mockResolvedValue({ emailVerifiedAt: new Date(), termsAcceptedAt: new Date() } as User);
    const state = await service.acceptTerms('u-1');
    expect(repository.acceptTerms).toHaveBeenCalledWith('u-1');
    expect(audit.record).toHaveBeenCalledWith('account.terms_accepted', 'u-1');
    expect(state.completed).toBe(true);
  });
});
