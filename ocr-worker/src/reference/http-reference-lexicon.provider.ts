import { Injectable, Logger } from '@nestjs/common';
import type { ReferenceLexiconProvider } from './reference-lexicon-provider.interface';

interface NamedDto {
  id: string;
  name: string;
}
interface ActivityDto {
  id: string;
  name: string;
}
interface AliasDto {
  value: string;
}
interface VenueDto {
  id: string;
  name: string;
  city: string | null;
}

/**
 * Charge le lexique des référentiels via l'API REST du Backend (même schéma que le
 * classifier : login service + GET), avec cache par TTL. En cas d'échec (Backend
 * indisponible), renvoie une liste vide : l'OCR fonctionne sans dictionnaire utilisateur.
 */
@Injectable()
export class HttpReferenceLexiconProvider implements ReferenceLexiconProvider {
  private readonly logger = new Logger(HttpReferenceLexiconProvider.name);
  private readonly baseUrl =
    process.env.OCR_BACKEND_URL ??
    process.env.CLASSIFIER_BACKEND_URL ??
    'http://localhost:3000/api/v1';
  private readonly email =
    process.env.OCR_SERVICE_EMAIL ??
    process.env.CLASSIFIER_SERVICE_EMAIL ??
    'admin@event-foundry.local';
  private readonly password =
    process.env.OCR_SERVICE_PASSWORD ??
    process.env.CLASSIFIER_SERVICE_PASSWORD ??
    'change-me-dev-only';
  private readonly ttlMs = Number(process.env.REFERENCE_TTL_MS ?? '300000');

  private cache: string[] = [];
  private loadedAt = 0;

  async getWords(): Promise<string[]> {
    if (this.loadedAt !== 0 && Date.now() - this.loadedAt < this.ttlMs) {
      return this.cache;
    }
    try {
      this.cache = await this.load();
      this.loadedAt = Date.now();
      this.logger.log(`Lexique référentiel chargé : ${this.cache.length} mots.`);
    } catch (error) {
      this.loadedAt = Date.now(); // évite de marteler le Backend ; retente au prochain TTL
      this.logger.warn(
        `Lexique indisponible, OCR sans dictionnaire utilisateur : ${(error as Error).message}`,
      );
    }
    return this.cache;
  }

  private async load(): Promise<string[]> {
    const token = await this.login();
    const [activities, eventTypes, eventFormats, organizers, venues] = await Promise.all([
      this.getJson<ActivityDto[]>('/activities', token),
      this.getJson<NamedDto[]>('/event-types', token),
      this.getJson<NamedDto[]>('/event-formats', token),
      this.getJson<NamedDto[]>('/organizers', token),
      this.getJson<VenueDto[]>('/venues', token),
    ]);

    const phrases: string[] = [
      ...activities.map((a) => a.name),
      ...eventTypes.map((t) => t.name),
      ...eventFormats.map((f) => f.name),
      ...organizers.map((o) => o.name),
      ...venues.map((v) => v.name),
      ...venues.map((v) => v.city ?? ''),
    ];

    // Alias des activités (ex. « MTG » pour Magic) — aussi issus des référentiels.
    const aliasLists = await Promise.all(
      activities.map((a) => this.getJson<AliasDto[]>(`/activities/${a.id}/aliases`, token)),
    );
    for (const aliases of aliasLists) {
      phrases.push(...aliases.map((alias) => alias.value));
    }

    return tokenize(phrases);
  }

  private async login(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    if (!response.ok) {
      throw new Error(`login HTTP ${response.status}`);
    }
    const body = (await response.json()) as { accessToken: string };
    return body.accessToken;
  }

  private async getJson<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`GET ${path} HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Découpe des libellés en mots pour le dictionnaire Tesseract : tokens alphanumériques (avec
 * apostrophes/traits d'union internes), longueur ≥ 2, contenant au moins une lettre,
 * dédupliqués sans tenir compte de la casse (première forme conservée).
 */
export function tokenize(phrases: string[]): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const phrase of phrases) {
    for (const raw of phrase.split(/\s+/)) {
      const token = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu, '');
      if (token.length < 2 || !/\p{L}/u.test(token)) {
        continue;
      }
      const key = token.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        words.push(token);
      }
    }
  }
  return words;
}
