import { BadRequestException, Injectable } from '@nestjs/common';

/** Résultat d'une récupération HTTP (phase Fetch — ADR.14). */
export interface FetchedContent {
  content: string;
  contentType: string | null;
  finalUrl: string;
}

/**
 * Phase **Fetch** du pipeline (ADR.14) : récupère fidèlement le contenu d'une URL, sans
 * interprétation. Isolé dans un service injectable pour la testabilité (le connecteur reste pur,
 * sans I/O). Rejette les schémas non http(s) et borne la durée.
 */
@Injectable()
export class HttpFetcherService {
  private readonly timeoutMs = 15_000;
  private readonly maxBytes = 5 * 1024 * 1024;

  async fetch(url: string): Promise<FetchedContent> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('URL invalide.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Seules les URL http(s) sont acceptées.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: { accept: 'text/html,application/xhtml+xml' },
      });
      if (!response.ok) {
        throw new BadRequestException(`La page a répondu ${response.status}.`);
      }
      const buffer = Buffer.from(await response.arrayBuffer()).subarray(0, this.maxBytes);
      return {
        content: buffer.toString('utf-8'),
        contentType: response.headers.get('content-type'),
        finalUrl: response.url || parsed.toString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Impossible de récupérer la page : ${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
