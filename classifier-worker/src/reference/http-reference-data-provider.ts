import { Injectable, Logger } from '@nestjs/common';
import { requireEnv } from '@event-foundry/libraries';
import type { ReferenceDataProvider } from './reference-data-provider.interface';
import {
  EMPTY_SNAPSHOT,
  type ReferenceActivity,
  type ReferenceFormat,
  type ReferenceModality,
  type ReferenceNamed,
  type ReferenceOrganizer,
  type ReferenceSnapshot,
  type ReferenceSubject,
  type ReferenceVenue,
} from './reference-snapshot';

interface ActivityDto {
  id: string;
  name: string;
  domainId: string;
}
interface AliasDto {
  value: string;
}
interface NamedDto {
  id: string;
  name: string;
}
interface FormatDto {
  id: string;
  name: string;
}
interface SimpleRefDto {
  id: string;
  name: string;
}
interface OrganizerDto {
  id: string;
  name: string;
}
interface VenueDto {
  id: string;
  name: string;
  city: string | null;
}

/**
 * Charge les référentiels via l'API REST du Backend, avec cache et rafraîchissement par
 * TTL. En cas d'échec (Backend indisponible), conserve le dernier instantané connu (ou un
 * instantané vide) : les règles indépendantes des référentiels (date, prix, URL...)
 * continuent de fonctionner.
 */
@Injectable()
export class HttpReferenceDataProvider implements ReferenceDataProvider {
  private readonly logger = new Logger(HttpReferenceDataProvider.name);
  private readonly baseUrl = process.env.CLASSIFIER_BACKEND_URL ?? 'http://localhost:3000/api/v1';
  private readonly email = process.env.CLASSIFIER_SERVICE_EMAIL ?? 'admin@event-foundry.local';
  // Mot de passe du compte de service : requis, jamais de valeur par défaut codée en dur (ADR.21).
  private readonly password = requireEnv('CLASSIFIER_SERVICE_PASSWORD');
  private readonly ttlMs = Number(process.env.REFERENCE_TTL_MS ?? '300000');

  private cache: ReferenceSnapshot = EMPTY_SNAPSHOT;
  private loadedAt = 0;

  async getSnapshot(): Promise<ReferenceSnapshot> {
    if (Date.now() - this.loadedAt < this.ttlMs && this.loadedAt !== 0) {
      return this.cache;
    }
    try {
      this.cache = await this.load();
      this.loadedAt = Date.now();
    } catch (error) {
      // Évite de marteler le Backend ; on retentera au prochain TTL.
      this.loadedAt = Date.now();
      this.logger.warn(
        `Référentiels indisponibles, instantané précédent conservé : ${(error as Error).message}`,
      );
    }
    return this.cache;
  }

  private async load(): Promise<ReferenceSnapshot> {
    const token = await this.login();
    const [activities, eventTypes, eventFormats, subjects, modalities, organizers, venues] =
      await Promise.all([
        this.getJson<ActivityDto[]>('/activities', token),
        this.getJson<NamedDto[]>('/event-types', token),
        this.getJson<FormatDto[]>('/event-formats', token),
        this.getJson<SimpleRefDto[]>('/subjects', token),
        this.getJson<SimpleRefDto[]>('/modalities', token),
        this.getJson<OrganizerDto[]>('/organizers', token),
        this.getJson<VenueDto[]>('/venues', token),
      ]);

    const activitiesWithAliases: ReferenceActivity[] = await Promise.all(
      activities.map(async (activity) => {
        const aliases = await this.getJson<AliasDto[]>(
          `/activities/${activity.id}/aliases`,
          token,
        );
        return {
          id: activity.id,
          name: activity.name,
          domainId: activity.domainId,
          aliases: aliases.map((alias) => alias.value),
        };
      }),
    );

    const named = (items: NamedDto[]): ReferenceNamed[] =>
      items.map((item) => ({ id: item.id, name: item.name }));
    const formats: ReferenceFormat[] = eventFormats.map((f) => ({ id: f.id, name: f.name }));
    const subs: ReferenceSubject[] = subjects.map((s) => ({ id: s.id, name: s.name }));
    const mods: ReferenceModality[] = modalities.map((m) => ({ id: m.id, name: m.name }));
    const orgs: ReferenceOrganizer[] = organizers.map((o) => ({ id: o.id, name: o.name }));
    const places: ReferenceVenue[] = venues.map((v) => ({ id: v.id, name: v.name, city: v.city }));

    return {
      activities: activitiesWithAliases,
      eventTypes: named(eventTypes),
      eventFormats: formats,
      subjects: subs,
      modalities: mods,
      organizers: orgs,
      venues: places,
    };
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
