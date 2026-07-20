import { Inject, Injectable } from '@nestjs/common';
import { SecretScope, SecretStatus, SecretType, type AiConfig } from '@prisma/client';
import {
  SECRETS_PROVIDER,
  type SecretMetadata,
  type SecretsProvider,
} from '../secrets/ports/secrets-provider';
import { AiConfigDto, UpdateAiConfigDto } from './dto/ai-config.dto';
import { AiConfigRepository } from './ai-config.repository';

/** Portée « plateforme » (clé de scope fixe, secret sans scopeId). */
export const PLATFORM_SCOPE_KEY = 'PLATFORM';

/** Résolution d'un assistant IA pour un cas d'usage (fallback org → user → plateforme). */
export interface ResolvedAssistant {
  scope: SecretScope;
  provider: string;
  model: string;
  apiKey: string;
}

/**
 * Configuration IA (ADR.16 / TSPEC.07) : opt-in par portée, cas d'usage activables, clé stockée
 * comme **secret** (jamais en clair). L'IA reste de l'**assistance** ; la décision métier est
 * déterministe. La résolution suit un fallback (organisation → utilisateur → plateforme → aucun).
 */
@Injectable()
export class AiConfigService {
  constructor(
    private readonly repository: AiConfigRepository,
    @Inject(SECRETS_PROVIDER) private readonly secrets: SecretsProvider,
  ) {}

  async get(scope: SecretScope, scopeKey: string): Promise<AiConfigDto | null> {
    const config = await this.repository.find(scope, scopeKey);
    return config ? this.toDto(config) : null;
  }

  async update(scope: SecretScope, scopeKey: string, dto: UpdateAiConfigDto): Promise<AiConfigDto> {
    const existing = await this.repository.find(scope, scopeKey);
    let secretRef = existing?.secretRef ?? null;

    if (dto.apiKey && dto.apiKey.trim()) {
      // Stocke/renouvelle la clé comme secret (même référence si elle existe déjà — rotation).
      const meta = await this.secrets.put({
        reference: secretRef ?? undefined,
        type: SecretType.AI_KEY,
        scope,
        scopeId: scope === SecretScope.PLATFORM ? null : scopeKey,
        provider: dto.provider,
        value: dto.apiKey.trim(),
      });
      secretRef = meta.reference;
    }

    const saved = await this.repository.upsert(scope, scopeKey, {
      provider: dto.provider,
      model: dto.model,
      enabled: dto.enabled,
      useCases: sanitizeUseCases(dto.useCases),
      secretRef,
      // Une nouvelle clé ou un changement remet le statut à « configuré, non testé ».
      status: SecretStatus.CONFIGURED,
    });
    return this.toDto(saved);
  }

  /**
   * Test de connexion (BOUCHON) : vérifie que la clé est résolvable et non vide, puis marque
   * TESTED / FAILED. En production, remplacé par un vrai ping du fournisseur.
   */
  async test(scope: SecretScope, scopeKey: string): Promise<{ status: SecretStatus }> {
    const config = await this.repository.find(scope, scopeKey);
    let ok = false;
    if (config?.secretRef) {
      try {
        const key = await this.secrets.resolve(config.secretRef);
        ok = key.trim().length > 0;
      } catch {
        ok = false;
      }
    }
    const status = ok ? SecretStatus.TESTED : SecretStatus.FAILED;
    if (config) {
      await this.repository.setStatus(scope, scopeKey, status);
      if (config.secretRef) {
        await this.secrets.setStatus(config.secretRef, status);
      }
    }
    return { status };
  }

  /**
   * Résout l'assistant IA à utiliser pour un cas d'usage, du plus spécifique au repli (RG-AI-06) :
   * organisation active → utilisateur → plateforme. Retourne `null` si aucun (→ déterminisme).
   */
  async resolveForUseCase(
    userId: string,
    organizationId: string | null,
    useCase: string,
  ): Promise<ResolvedAssistant | null> {
    const candidates: [SecretScope, string][] = [];
    if (organizationId) {
      candidates.push([SecretScope.ORGANIZATION, organizationId]);
    }
    candidates.push([SecretScope.USER, userId]);
    candidates.push([SecretScope.PLATFORM, PLATFORM_SCOPE_KEY]);

    for (const [scope, scopeKey] of candidates) {
      const config = await this.repository.find(scope, scopeKey);
      if (!config || !config.enabled || !config.secretRef) {
        continue;
      }
      const useCases = (config.useCases ?? {}) as Record<string, boolean>;
      if (useCases[useCase] !== true) {
        continue;
      }
      try {
        const apiKey = await this.secrets.resolve(config.secretRef);
        if (apiKey.trim()) {
          return { scope, provider: config.provider, model: config.model, apiKey };
        }
      } catch {
        // secret indisponible : on tente le niveau suivant.
      }
    }
    return null;
  }

  private async toDto(config: AiConfig): Promise<AiConfigDto> {
    let secret: SecretMetadata | null = null;
    if (config.secretRef) {
      secret = await this.secrets.describe(config.secretRef);
    }
    return {
      scope: config.scope,
      scopeKey: config.scopeKey,
      provider: config.provider,
      model: config.model,
      enabled: config.enabled,
      useCases: (config.useCases ?? {}) as Record<string, boolean>,
      status: config.status,
      secret: secret
        ? { reference: secret.reference, masked: secret.masked, status: secret.status }
        : null,
    };
  }
}

/** Ne conserve que des booléens (défense contre des valeurs inattendues). */
function sanitizeUseCases(useCases: Record<string, boolean>): Record<string, boolean> {
  const clean: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(useCases)) {
    clean[key] = value === true;
  }
  return clean;
}
