import type { EventWithRefs, UserParticipation } from '../entities/event.entity';
import { EventResponseDto, ParticipationStateDto } from '../dto/event-response.dto';

export class EventMapper {
  static toResponse(
    event: EventWithRefs,
    participation: UserParticipation | null = null,
  ): EventResponseDto {
    return {
      id: event.id,
      source: event.source,
      status: event.status,
      title: event.title,
      description: event.description,
      activity: event.activity.name,
      eventType: event.eventType ? event.eventType.name : null,
      eventFormat: event.eventFormat ? event.eventFormat.name : null,
      category: event.category ? event.category.name : null,
      organizer: event.organizer ? event.organizer.name : null,
      venue: event.venue ? event.venue.name : null,
      municipality: event.municipality ? event.municipality.name : null,
      region: event.municipality ? event.municipality.region.name : null,
      country: event.municipality ? event.municipality.region.country.name : null,
      tags: event.tags.map((eventTag) => eventTag.tag.name),
      city: event.venue ? event.venue.city : null,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      price: event.price,
      currency: event.currency,
      participation: participation ? EventMapper.toParticipationState(participation) : null,
    };
  }

  private static toParticipationState(participation: UserParticipation): ParticipationStateDto {
    return {
      interested: participation.interested,
      reservationStatus: participation.reservationStatus,
      paymentStatus: participation.paymentStatus,
    };
  }
}
