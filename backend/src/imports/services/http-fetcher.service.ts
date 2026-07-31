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
        // En-têtes proches d'un navigateur : de nombreux sites rejettent (403) une requête sans
        // User-Agent. N'aide pas contre une protection anti-bot avancée (Cloudflare, challenge JS).
        headers: {
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });
      if (!response.ok) {
        const hint =
          response.status === 403 || response.status === 429
            ? " (protection anti-bot du site : une capture navigateur/rendu JS serait nécessaire)"
            : '';
        throw new BadRequestException(`La page a répondu ${response.status}${hint}.`);
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
