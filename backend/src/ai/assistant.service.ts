import { Injectable } from '@nestjs/common';
import { AiCallLogService } from './ai-call-log.service';
import { AiConfigService } from './ai-config.service';
import { AiTextClient } from './ai-text-client';

/** Cas d'usage IA « texte » (assistance à l'affichage, jamais une décision métier — ADR.16). */
export type TextAssistUseCase = 'TRANSLATE' | 'SUMMARIZE' | 'REPHRASE';

export interface AssistResult {
  useCase: TextAssistUseCase;
  /** true si l'IA a produit un texte ; false = aucune IA configurée/activée (repli déterministe). */
  assisted: boolean;
  text: string | null;
  provider: string | null;
}

const MAX_INPUT = 8000;

/**
 * Assistance IA « texte » (ADR.16) : traduction / résumé / reformulation d'un contenu, à la demande.
 * Réutilise la résolution de configuration (fallback organisation → utilisateur → plateforme). Si
 * aucune IA n'est activée pour le cas d'usage : repli déterministe (assisted=false), jamais d'erreur.
 * Le résultat n'est ni persisté ni utilisé comme champ métier (règle d'or n°1).
 */
@Injectable()
export class AssistantService {
  constructor(
    private readonly aiConfig: AiConfigService,
    private readonly textClient: AiTextClient,
    private readonly callLog: AiCallLogService,
  ) {}

  async assist(
    userId: string,
    organizationId: string | null,
    useCase: TextAssistUseCase,
    text: string,
    targetLanguage?: string,
  ): Promise<AssistResult> {
    const input = text.trim().slice(0, MAX_INPUT);
    if (!input) {
      return { useCase, assisted: false, text: null, provider: null };
    }
    const assistant = await this.aiConfig.resolveForUseCase(userId, organizationId, useCase);
    if (!assistant) {
      return { useCase, assisted: false, text: null, provider: null };
    }

    const startedAt = Date.now();
    try {
      const output = await this.textClient.run(assistant, buildPrompt(useCase, input, targetLanguage));
      await this.callLog.record({
        useCase,
        provider: assistant.provider,
        model: assistant.model,
        durationMs: Date.now() - startedAt,
        status: output.trim() ? 'SUCCESS' : 'FAILED',
        correlationId: 'ai-assist',
      });
      if (!output.trim()) {
        return { useCase, assisted: false, text: null, provider: assistant.provider };
      }
      return { useCase, assisted: true, text: output, provider: assistant.provider };
    } catch {
      // Échec fournisseur : repli déterministe (pas de décision métier), journalisé sans contenu.
      await this.callLog.record({
        useCase,
        provider: assistant.provider,
        model: assistant.model,
        durationMs: Date.now() - startedAt,
        status: 'FAILED',
        correlationId: 'ai-assist',
      });
      return { useCase, assisted: false, text: null, provider: assistant.provider };
    }
  }
}

function buildPrompt(useCase: TextAssistUseCase, text: string, targetLanguage?: string): string {
  switch (useCase) {
    case 'TRANSLATE':
      return (
        `Traduis le texte suivant en ${targetLanguage?.trim() || 'français'}. ` +
        `Réponds UNIQUEMENT par la traduction, sans commentaire ni guillemets.\n\n${text}`
      );
    case 'SUMMARIZE':
      return (
        'Résume le texte suivant en 2 à 3 phrases, en français. ' +
        `Réponds UNIQUEMENT par le résumé.\n\n${text}`
      );
    case 'REPHRASE':
      return (
        'Reformule le texte suivant pour le rendre plus clair, en conservant le sens et la langue. ' +
        `Réponds UNIQUEMENT par le texte reformulé.\n\n${text}`
      );
  }
}
