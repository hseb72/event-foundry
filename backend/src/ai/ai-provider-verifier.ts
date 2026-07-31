import { Injectable, Logger } from '@nestjs/common';
import { AI_PROVIDERS, findProvider, type AiProviderInfo } from './ai-providers';

const TIMEOUT_MS = 8000;
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Test de connexion **réel** d'un fournisseur IA (ADR.16). Effectue un appel léger de vérification
 * d'identifiants (liste de modèles) selon le fournisseur ; ne consomme pas de tokens de génération.
 * Aucune donnée sensible n'est journalisée. Renvoie simplement un booléen (clé valide/joignable).
 */
@Injectable()
export class AiProviderVerifier {
  private readonly logger = new Logger('AiProviderVerifier');

  async verify(providerId: string, apiKey: string): Promise<boolean> {
    const provider = findProvider(providerId) ?? fallbackOpenAiCompatible(providerId);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const response = await this.probe(provider, apiKey, controller.signal);
        return response.ok;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      this.logger.warn(`Test fournisseur ${providerId} échoué : ${(error as Error).message}`);
      return false;
    }
  }

  private probe(provider: AiProviderInfo, apiKey: string, signal: AbortSignal): Promise<Response> {
    switch (provider.kind) {
      case 'anthropic':
        return fetch(`${provider.baseUrl}/models`, {
          headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION },
          signal,
        });
      case 'gemini':
        return fetch(`${provider.baseUrl}/models?key=${encodeURIComponent(apiKey)}`, { signal });
      case 'openai-compatible':
      default:
        return fetch(`${provider.baseUrl}/models`, {
          headers: provider.requiresKey ? { authorization: `Bearer ${apiKey}` } : {},
          signal,
        });
    }
  }
}

/** Fournisseur inconnu : tenté en OpenAI-compatible sur une base fixe (jamais l'URL saisie — anti-SSRF). */
function fallbackOpenAiCompatible(id: string): AiProviderInfo {
  return {
    id,
    label: id,
    kind: 'openai-compatible',
    baseUrl: AI_PROVIDERS[0].baseUrl,
    suggestedModels: [],
    requiresKey: true,
  };
}
