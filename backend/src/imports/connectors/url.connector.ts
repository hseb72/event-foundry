import { Injectable, Logger } from '@nestjs/common';
import { ImportChannel } from '@prisma/client';
import type {
  ConnectorDescriptor,
  ConnectorExtractInput,
  ImportConnector,
  RawEventDraft,
} from './import-connector';

/** Types schema.org considérés comme des événements (Event et ses sous-types). */
const EVENT_TYPES = new Set([
  'Event',
  'BusinessEvent',
  'ChildrensEvent',
  'ComedyEvent',
  'CourseInstance',
  'DanceEvent',
  'DeliveryEvent',
  'EducationEvent',
  'ExhibitionEvent',
  'Festival',
  'FoodEvent',
  'Hackathon',
  'LiteraryEvent',
  'MusicEvent',
  'PublicationEvent',
  'SaleEvent',
  'ScreeningEvent',
  'SocialEvent',
  'SportsEvent',
  'TheaterEvent',
  'VisualArtsEvent',
]);

/**
 * Connecteur **URL / page de fournisseur** (ADR.13 §Capture). Extraction **déterministe** des
 * événements décrits en **schema.org JSON-LD** (`<script type="application/ld+json">`), format
 * standard des pages d'événements. Aucune décision métier : le connecteur ne fait que collecter les
 * objets `Event` fidèlement ; le pipeline normalise ensuite. L'extraction assistée par IA des pages
 * sans balisage structuré est un prolongement optionnel (ADR.16), hors de ce connecteur déterministe.
 */
@Injectable()
export class UrlConnector implements ImportConnector {
  private readonly logger = new Logger(UrlConnector.name);
  readonly providerId = 'web-url';
  readonly version = '1.0.0';
  readonly channel = ImportChannel.URL;

  describe(): ConnectorDescriptor {
    return {
      providerId: this.providerId,
      label: 'Page web (schema.org)',
      channel: this.channel,
      accepts: ['text/html'],
      schemaSummary:
        'Événements balisés en JSON-LD schema.org (Event et sous-types). Les pages sans balisage ' +
        'structuré ne produisent aucun événement (extraction IA optionnelle, hors périmètre déterministe).',
      requiresAi: false,
    };
  }

  /** `content` = HTML de la page. Collecte les objets schema.org Event des blocs JSON-LD. */
  extract(input: ConnectorExtractInput): RawEventDraft[] {
    const blocks = this.jsonLdBlocks(input.content ?? '');
    const events: Record<string, unknown>[] = [];
    for (const block of blocks) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(block);
      } catch (error) {
        // Un bloc JSON-LD malformé n'interrompt pas l'extraction (RG-IMP-07 : isolation).
        this.logger.debug(`Bloc JSON-LD ignoré : ${(error as Error).message}`);
        continue;
      }
      this.collectEvents(parsed, events);
    }
    return events.map((event) => ({
      providerKey: this.readKey(event),
      payload: event,
    }));
  }

  private jsonLdBlocks(html: string): string[] {
    const blocks: string[] = [];
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      blocks.push(match[1].trim());
    }
    return blocks;
  }

  /** Parcourt objets, tableaux et `@graph` pour collecter les nœuds de type Event. */
  private collectEvents(node: unknown, out: Record<string, unknown>[]): void {
    if (Array.isArray(node)) {
      node.forEach((child) => this.collectEvents(child, out));
      return;
    }
    if (node === null || typeof node !== 'object') {
      return;
    }
    const record = node as Record<string, unknown>;
    if (Array.isArray(record['@graph'])) {
      this.collectEvents(record['@graph'], out);
    }
    if (this.isEvent(record['@type'])) {
      out.push(record);
    }
  }

  private isEvent(type: unknown): boolean {
    if (typeof type === 'string') {
      return EVENT_TYPES.has(type);
    }
    if (Array.isArray(type)) {
      return type.some((t) => typeof t === 'string' && EVENT_TYPES.has(t));
    }
    return false;
  }

  private readKey(event: Record<string, unknown>): string | null {
    const raw = event['url'] ?? event['@id'] ?? event['identifier'];
    const value = typeof raw === 'string' ? raw.trim() : '';
    return value.length > 0 ? value : null;
  }
}
