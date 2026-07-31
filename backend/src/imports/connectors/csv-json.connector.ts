import { Injectable } from '@nestjs/common';
import { ImportChannel } from '@prisma/client';
import type {
  ConnectorDescriptor,
  ConnectorExtractInput,
  ImportConnector,
  RawEventDraft,
} from './import-connector';

/**
 * Connecteur **CSV / JSON déterministe** (ADR.13/14 — connecteur de référence). 100 % déterministe :
 * ni OCR ni IA. Parse un contenu formaté selon un schéma documenté et produit des ébauches de Raw
 * Event *fidèles* (le payload reflète exactement l'objet source). Aucune décision métier.
 *
 * Schéma accepté (colonnes / clés — toutes optionnelles sauf `title` et `starts_at`) :
 *   key, title, description, starts_at, ends_at, price, currency,
 *   activity, event_type, event_format, organizer, venue, city, url
 * Alias camelCase tolérés (startsAt, endsAt, eventType, eventFormat). CSV : séparateur virgule,
 * guillemets doubles échappés `""`, première ligne = en-têtes. JSON : tableau d'objets.
 */
@Injectable()
export class CsvJsonConnector implements ImportConnector {
  readonly providerId = 'structured-file';
  readonly version = '1.0.0';
  readonly channel = ImportChannel.CSV;

  describe(): ConnectorDescriptor {
    return {
      providerId: this.providerId,
      label: 'Fichier structuré (CSV / JSON)',
      channel: this.channel,
      accepts: ['text/csv', 'application/json', 'text/plain'],
      schemaSummary:
        'Colonnes/clés : key, title, description, starts_at, ends_at, price, currency, activity, ' +
        'event_type, event_format, organizer, venue, city, url. Requis : title, starts_at.',
      requiresAi: false,
    };
  }

  extract(input: ConnectorExtractInput): RawEventDraft[] {
    const content = input.content?.trim() ?? '';
    if (!content) {
      return [];
    }
    const rows = this.isJson(content, input.contentType)
      ? this.parseJson(content)
      : this.parseCsv(content);
    return rows.map((row) => ({
      providerKey: this.readKey(row),
      payload: row,
    }));
  }

  private isJson(content: string, contentType?: string | null): boolean {
    if (contentType?.includes('json')) {
      return true;
    }
    const first = content[0];
    return first === '[' || first === '{';
  }

  private parseJson(content: string): Record<string, unknown>[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error(`JSON invalide : ${(error as Error).message}`);
    }
    const array = Array.isArray(parsed) ? parsed : [parsed];
    return array.map((item, index) => {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`Élément JSON #${index + 1} : un objet est attendu.`);
      }
      return item as Record<string, unknown>;
    });
  }

  /** Parseur CSV minimal et déterministe (virgule, guillemets doubles, échappement `""`, CRLF/LF). */
  private parseCsv(content: string): Record<string, unknown>[] {
    const records = this.splitCsvRecords(content);
    if (records.length === 0) {
      return [];
    }
    const headers = records[0].map((h) => h.trim());
    const rows: Record<string, unknown>[] = [];
    for (let i = 1; i < records.length; i++) {
      const cells = records[i];
      if (cells.length === 1 && cells[0] === '') {
        continue; // ligne vide
      }
      const row: Record<string, unknown> = {};
      headers.forEach((header, col) => {
        if (header) {
          row[header] = cells[col] ?? '';
        }
      });
      rows.push(row);
    }
    return rows;
  }

  private splitCsvRecords(content: string): string[][] {
    const records: string[][] = [];
    let field = '';
    let record: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      if (inQuotes) {
        if (ch === '"') {
          if (content[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        record.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        // Fin de ligne (avale \r\n en une passe).
        if (ch === '\r' && content[i + 1] === '\n') {
          i++;
        }
        record.push(field);
        records.push(record);
        record = [];
        field = '';
      } else {
        field += ch;
      }
    }
    // Dernier champ / dernière ligne (fichier sans saut final).
    if (field !== '' || record.length > 0) {
      record.push(field);
      records.push(record);
    }
    return records;
  }

  private readKey(row: Record<string, unknown>): string | null {
    const raw = row['key'] ?? row['id'] ?? row['providerKey'] ?? row['provider_key'];
    const value = typeof raw === 'string' ? raw.trim() : raw != null ? String(raw) : '';
    return value.length > 0 ? value : null;
  }
}
