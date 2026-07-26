import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventStatus, type Case, type ModerationLog } from '@prisma/client';
import { CasesService } from '../cases/cases.service';
import { SearchIndexService } from '../search/services/search-index.service';
import {
  caseTypeForReason,
  DECISIONS_REQUIRING_JUSTIFICATION,
  type ModerationDecision,
  type ModerationObject,
  type ReportReason,
} from './moderation-catalog';
import { ModerationRepository } from './moderation.repository';

/** Cible d'un signalement / d'une décision (§3). */
interface ModerationTarget {
  objectType: ModerationObject;
  objectId: string;
}

/**
 * Modération de la plateforme (FSPEC.20). Un signalement ouvre une **Case** dans la file Moderation
 * (réutilise FSPEC.21) ; les décisions sont **appliquées à l'objet** (masquage/suspension/rétablissement)
 * et **historisées** (MOD-003). Les contenus suspendus sont conservés (MOD-005). Toute décision
 * importante est justifiée (MOD-004). Une décision peut être révisée (MOD-007) : c'est une nouvelle
 * décision inverse, elle aussi tracée.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly repository: ModerationRepository,
    private readonly cases: CasesService,
    private readonly search: SearchIndexService,
  ) {}

  /** Signalement d'un contenu par un utilisateur (§11) → ouvre une Case de modération. */
  async report(
    userId: string,
    origin: string,
    target: ModerationTarget,
    reason: ReportReason,
    details?: string,
  ): Promise<{ caseId: string; reference: string }> {
    const opened = await this.cases.open({
      type: caseTypeForReason(reason),
      subject: `Signalement ${target.objectType.toLowerCase()} (${reason.toLowerCase()})`,
      description: details?.trim() || 'Aucun détail fourni.',
      origin: origin as never,
      requesterId: userId,
      metadata: { objectType: target.objectType, objectId: target.objectId, reason },
    });
    return { caseId: opened.id, reference: opened.reference };
  }

  /**
   * Décision de modération sur la cible d'une Case (§13). Applique l'effet à l'objet, historise la
   * décision (journal + événement de Case). La Case n'est pas transitionnée ici : l'Operator pilote
   * son statut dans la console (résolution/clôture).
   */
  async decide(
    caseId: string,
    operatorId: string,
    decision: ModerationDecision,
    justification?: string,
  ): Promise<ModerationLog> {
    if (DECISIONS_REQUIRING_JUSTIFICATION.includes(decision) && !justification?.trim()) {
      throw new BadRequestException('Cette décision doit être justifiée (MOD-004).');
    }
    const kase = await this.cases.getCase(caseId);
    const target = this.targetFromCase(kase);
    await this.applyEffect(target, decision);
    const log = await this.repository.recordLog({
      objectType: target.objectType,
      objectId: target.objectId,
      decision,
      justification: justification?.trim() || null,
      operatorId,
      caseId,
    });
    await this.cases.logEvent(caseId, operatorId, 'MODERATION_DECISION', justification?.trim(), {
      decision,
      objectType: target.objectType,
      objectId: target.objectId,
    });
    this.logger.log(`ModerationDecision ${decision} on ${target.objectType}/${target.objectId} (case ${caseId})`);
    return log;
  }

  history(objectType: string, objectId: string): Promise<ModerationLog[]> {
    return this.repository.history(objectType, objectId);
  }

  // --- Effets ---

  /** Applique la décision à l'objet. NO_ACTION / REQUEST_CORRECTION ne modifient pas l'objet. */
  private async applyEffect(target: ModerationTarget, decision: ModerationDecision): Promise<void> {
    if (decision === 'NO_ACTION' || decision === 'REQUEST_CORRECTION') {
      return;
    }
    if (target.objectType === 'EVENT') {
      if (!(await this.repository.eventExists(target.objectId))) {
        throw new NotFoundException('Événement cible introuvable.');
      }
      if (decision === 'RESTORE') {
        await this.repository.setEventStatus(target.objectId, EventStatus.PUBLISHED);
        await this.search.index(target.objectId);
      } else {
        // HIDE / SUSPEND : retiré de la diffusion (archivé), conservé (MOD-005).
        await this.repository.setEventStatus(target.objectId, EventStatus.ARCHIVED);
        await this.search.remove(target.objectId);
      }
      return;
    }
    if (target.objectType === 'ORGANIZATION') {
      if (!(await this.repository.organizationExists(target.objectId))) {
        throw new NotFoundException('Organisation cible introuvable.');
      }
      await this.repository.setOrganizationActive(target.objectId, decision === 'RESTORE');
      return;
    }
    // VENUE / IMAGE / ACTIVITY : effet non implémenté en 20-A (décision journalisée uniquement).
    this.logger.warn(`Décision ${decision} sur ${target.objectType} : journalisée, effet non appliqué (20-A).`);
  }

  private targetFromCase(kase: Case): ModerationTarget {
    const meta = (kase.metadata ?? {}) as { objectType?: string; objectId?: string };
    if (!meta.objectType || !meta.objectId) {
      throw new BadRequestException("Cette Case ne cible pas d'objet modérable.");
    }
    return { objectType: meta.objectType as ModerationObject, objectId: meta.objectId };
  }
}
