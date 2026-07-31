import { Injectable } from '@nestjs/common';
import { EventResponseDto } from '../events/dto/event-response.dto';
import type { EventWithRefs } from '../events/entities/event.entity';
import { EventMapper } from '../events/mappers/event.mapper';
import { PublicRepository } from './public.repository';
import { EventCoverService } from '../event-covers/services/event-cover.service';

/** Coordonnées facultatives transmises par le visiteur (géolocalisation opt-in du navigateur). */
export interface VisitorLocation {
  latitude: number;
  longitude: number;
}

/** Fenêtre large récupérée avant tri par proximité, pour ne pas tronquer trop tôt les lieux géolocalisés. */
const PROXIMITY_POOL = 60;

/**
 * Sélection « à la Une » pour la page de garde. Par défaut : prochains événements publiés, triés par
 * date. Si le visiteur partage sa position (opt-in), on **priorise la proximité** (distance haversine
 * au lieu de l'événement) tout en gardant les événements sans coordonnées en fin de liste. Aucune
 * décision métier : simple lecture + tri géométrique. La participation est toujours nulle (anonyme).
 */
@Injectable()
export class PublicService {
  constructor(
    private readonly repository: PublicRepository,
    private readonly covers: EventCoverService,
  ) {}

  async featured(take: number, location?: VisitorLocation): Promise<EventResponseDto[]> {
    const pool = await this.repository.upcoming(new Date(), location ? PROXIMITY_POOL : take);
    const selected = location ? this.byProximity(pool, location).slice(0, take) : pool;
    const items = selected.map((event) => EventMapper.toResponse(event, null));
    await this.covers.attach(items);
    return items;
  }

  /** Trie les événements par distance croissante au visiteur ; les lieux sans coordonnées passent après. */
  private byProximity(events: EventWithRefs[], from: VisitorLocation): EventWithRefs[] {
    const distance = (event: EventWithRefs): number => {
      const lat = event.venue?.latitude;
      const lng = event.venue?.longitude;
      return lat == null || lng == null
        ? Number.POSITIVE_INFINITY
        : haversineKm(from.latitude, from.longitude, lat, lng);
    };
    return [...events].sort((a, b) => distance(a) - distance(b));
  }
}

/** Distance orthodromique approximative (km) entre deux points géographiques. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
