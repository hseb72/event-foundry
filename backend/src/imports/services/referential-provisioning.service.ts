import { Injectable, Logger } from '@nestjs/common';
import type { ExtractedEventFields } from '@event-foundry/contracts';
import type { ProvisioningConfig } from '../../platform-config/technical-config.service';
import { ReferentialProvisioningRepository } from '../repositories/referential-provisioning.repository';

/**
 * Auto-provisioning des référentiels (ADR.24). Pour les libellés extraits qui ne se résolvent vers
 * aucun référentiel, matérialise l'entrée manquante en **état provisoire** (curable), quand
 * l'opt-in est actif. Déterministe et best-effort : un échec de provisioning n'interrompt jamais
 * l'import (l'utilisateur pourra créer l'entrée en validation — Levier 2).
 *
 * L'IA/le connecteur a seulement fourni le libellé ; la matérialisation est une opération de données,
 * pas une décision métier (règle d'or n°1 préservée — ADR.16 §Frontière, ADR.24).
 */
@Injectable()
export class ReferentialProvisioningService {
  private readonly logger = new Logger(ReferentialProvisioningService.name);

  constructor(private readonly repository: ReferentialProvisioningRepository) {}

  /**
   * Provisionne les référentiels manquants d'un événement normalisé. Résout d'abord l'activité (les
   * type/format en dépendent), puis les référentiels indépendants. Sans effet si l'opt-in est off.
   */
  async provision(fields: ExtractedEventFields, config: ProvisioningConfig): Promise<void> {
    if (!config.autoProvisionReferentials) {
      return;
    }
    try {
      if (fields.activity) {
        // Le résultat n'est pas exploité : depuis DATA.01 v2.0 les autres référentiels sont
        // transverses. Seul l'effet de bord — provisionner l'activité — nous intéresse ici.
        await this.repository.resolveOrCreateActivity(
          fields.activity,
          config.provisioningDefaultDomainId,
        );
      }
      // Type : **transverse** (DATA.01 v2.0) — provisionné indépendamment de l'activité.
      if (fields.eventType) {
        await this.repository.resolveOrCreateEventType(fields.eventType);
      }
      if (fields.organizer) {
        await this.repository.resolveOrCreateOrganizer(fields.organizer);
      }
      if (fields.venue) {
        await this.repository.resolveOrCreateVenue(fields.venue);
      }
    } catch (error) {
      // Best-effort : ne jamais bloquer l'import sur un provisioning (repli Levier 2 en validation).
      this.logger.warn(`Auto-provisioning partiel ignoré : ${(error as Error).message}`);
    }
  }
}
