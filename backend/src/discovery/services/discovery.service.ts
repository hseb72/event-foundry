import { Injectable } from '@nestjs/common';
import { EventResponseDto } from '../../events/dto/event-response.dto';
import { EventMapper } from '../../events/mappers/event.mapper';
import { FacetsDto } from '../dto/facets.dto';
import { DiscoveryRepository } from '../repositories/discovery.repository';

/**
 * Domaine Discovery (TSPEC.04) : orchestration de l'exploration du catalogue. Sans donnée propre,
 * il expose la navigation à facettes et le mode « Surprends-moi ». La recherche filtrée/triée
 * reste servie par le module Events (Search).
 */
@Injectable()
export class DiscoveryService {
  constructor(private readonly repository: DiscoveryRepository) {}

  facets(): Promise<FacetsDto> {
    return this.repository.facets();
  }

  async surprise(userId: string, take: number): Promise<EventResponseDto[]> {
    const events = await this.repository.surprise(userId, take, new Date());
    return events.map((event) => EventMapper.toResponse(event, event.participations[0] ?? null));
  }
}
