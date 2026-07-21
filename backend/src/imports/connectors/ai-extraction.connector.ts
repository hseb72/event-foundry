import { Injectable, Logger } from '@nestjs/common';
import { ImportChannel } from '@prisma/client';
import { AiTextClient } from '../../ai/ai-text-client';
import type {
  ConnectorDescriptor,
  ConnectorExtractInput,
  ImportConnector,
  RawEventDraft,
} from './import-connector';

/**
 * Connecteur **extraction assistée par IA** (ADR.16 §Frontière). L'IA réalise la phase Extract et
 * remplit un **Raw Event structuré** contre le schéma pivot — des **libellés bruts tels qu'écrits**
 * dans le document, jamais des identifiants de référentiels ni une décision. Un **seul** appel IA
 * transforme le document en Raw Events (pas de texte intermédiaire re-parsé) ; la résolution
 * libellé → référentiel reste déterministe, en aval (Normalize). Le Raw Event est conservé, donc le
 * rejeu ne rappelle jamais l'IA (RG-IMP-03).
 */
@Injectable()
export class AiExtractionConnector implements ImportConnector {
  private readonly logger = new Logger(AiExtractionConnector.name);
  readonly providerId = 'ai-extraction';
  readonly version = '1.0.0';
  readonly channel = ImportChannel.TEXT;
  /** Version du prompt (traçabilité ADR.16 §Traçabilité — conservée via la version de connecteur). */
  private readonly promptVersion = 'extract-v1';

  private readonly MAX_INPUT = 12_000;

  constructor(private readonly aiTextClient: AiTextClient) {}

  describe(): ConnectorDescriptor {
    return {
      providerId: this.providerId,
      label: 'Extraction IA (document texte)',
      channel: this.channel,
      accepts: ['text/plain'],
      schemaSummary:
        'L’IA extrait des libellés bruts (title, starts_at, activity, event_type, venue, city, ' +
        'price, currency, description, url) — jamais de référentiel ni de décision. Repli déterministe si aucune IA.',
      requiresAi: true,
    };
  }

  /** `content` = texte du document ; `assistant` = IA résolue par le Backend (secrets non résolus ici). */
  async extract(input: ConnectorExtractInput): Promise<RawEventDraft[]> {
    const content = input.content?.trim() ?? '';
    if (!content || !input.assistant) {
      return [];
    }
    const prompt = this.buildPrompt(content.slice(0, this.MAX_INPUT));
    const raw = await this.aiTextClient.run(
      input.assistant as unknown as Parameters<AiTextClient['run']>[0],
      prompt,
    );
    const rows = this.parseRows(raw);
    return rows.map((row) => ({
      providerKey: typeof row['url'] === 'string' && row['url'].trim() ? String(row['url']).trim() : null,
      payload: row,
    }));
  }

  private buildPrompt(content: string): string {
    return [
      'Tu es un extracteur. À partir du TEXTE ci-dessous, extrais les événements décrits.',
      'Réponds UNIQUEMENT par un tableau JSON (aucun texte autour, aucune balise Markdown).',
      'Chaque élément est un objet avec ces clés (toutes optionnelles sauf title et starts_at) :',
      'title, description, starts_at, ends_at, activity, event_type, event_format, organizer, venue, city, price, currency, url.',
      'Règles STRICTES :',
      '- Recopie les valeurs telles qu’écrites dans le texte (libellés bruts). N’invente rien.',
      '- N’associe AUCUN libellé à un catalogue interne ; ne déduis pas de catégorie.',
      '- starts_at / ends_at : recopie la date/heure telles quelles (ISO si possible).',
      '- Si aucun événement, réponds [].',
      '',
      'TEXTE :',
      content,
    ].join('\n');
  }

  /** Parse tolérant : retire d’éventuelles balises ```json, isole le tableau, valide les objets. */
  private parseRows(raw: string): Record<string, unknown>[] {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    const slice = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    let parsed: unknown;
    try {
      parsed = JSON.parse(slice);
    } catch {
      this.logger.warn('Réponse IA non parseable en JSON — aucun événement extrait.');
      return [];
    }
    const array = Array.isArray(parsed) ? parsed : [parsed];
    return array.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item),
    );
  }
}
