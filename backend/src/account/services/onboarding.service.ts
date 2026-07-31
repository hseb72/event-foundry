import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from '../repositories/account.repository';
import { SECURITY_EVENTS, SecurityAuditService } from './security-audit.service';

/** Une étape d'onboarding et son état d'achèvement (FSPEC.16/17). */
export interface OnboardingStep {
  key: string;
  label: string;
  done: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  completed: boolean;
  /** Niveau d'onboarding (0..1) affiché dans les listes de membres. */
  level: number;
}

/**
 * Parcours d'intégration commun (FSPEC.16 §Onboarding / FSPEC.17 §Onboarding). En V3 : vérification
 * de l'adresse e-mail (déjà suivie) + acceptation des conditions d'utilisation. L'activation MFA
 * obligatoire rejoindra le parcours quand le MFA sera disponible. Le niveau d'onboarding est calculé
 * à partir de ces étapes et exposé aux administrateurs (organisation / plateforme).
 */
@Injectable()
export class OnboardingService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly audit: SecurityAuditService,
  ) {}

  async get(userId: string): Promise<OnboardingState> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    return computeOnboarding(user.emailVerifiedAt, user.termsAcceptedAt);
  }

  /** Marque les conditions d'utilisation comme acceptées (idempotent) et audite l'étape. */
  async acceptTerms(userId: string): Promise<OnboardingState> {
    const user = await this.repository.acceptTerms(userId);
    await this.audit.record(SECURITY_EVENTS.TERMS_ACCEPTED, userId);
    return computeOnboarding(user.emailVerifiedAt, user.termsAcceptedAt);
  }
}

/** Calcule l'état d'onboarding à partir des jalons (fonction pure, réutilisable pour un niveau). */
export function computeOnboarding(
  emailVerifiedAt: Date | null,
  termsAcceptedAt: Date | null,
): OnboardingState {
  const steps: OnboardingStep[] = [
    { key: 'email_verified', label: 'Adresse e-mail vérifiée', done: emailVerifiedAt != null },
    { key: 'terms_accepted', label: "Conditions d'utilisation acceptées", done: termsAcceptedAt != null },
  ];
  const done = steps.filter((s) => s.done).length;
  return { steps, completed: done === steps.length, level: done / steps.length };
}
