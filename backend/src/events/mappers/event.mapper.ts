import type { EventWithRefs, UserParticipation } from '../entities/event.entity';
import { EventEditDto } from '../dto/event-edit.dto';
import { EventResponseDto, ParticipationStateDto } from '../dto/event-response.dto';

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED'];

export class EventMapper {
  /**
   * Vue d'édition (par identifiants) pour préremplir le formulaire de correction — espace Organizer.
   * La localisation est exposée en cascade pays / région / commune.
   */
  static toEditDto(event: EventWithRefs): EventEditDto {
    return {
      id: event.id,
      status: event.status,
      editable: EDITABLE_STATUSES.includes(event.status),
      activityId: event.activityId,
      eventTypeId: event.eventTypeId,
      eventFormatIds: event.formats.map((link) => link.eventFormatId),
      categoryIds: event.categories.map((link) => link.categoryId),
      organizerId: event.organizerId,
      venueId: event.venueId,
      countryId: event.municipality ? event.municipality.region.country.id : null,
      regionId: event.municipality ? event.municipality.region.id : null,
      municipalityId: event.municipalityId,
      tagIds: event.tags.map((eventTag) => eventTag.tagId),
      title: event.title,
      description: event.description,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      price: event.price,
      currency: event.currency,
    };
  }

  static toResponse(
    event: EventWithRefs,
    participation: UserParticipation | null = null,
  ): EventResponseDto {
    return {
      id: event.id,
      source: event.source,
      status: event.status,
      visibility: event.visibility,
      title: event.title,
      description: event.description,
      activity: event.activity.name,
      eventType: event.eventType ? event.eventType.name : null,
      eventFormats: event.formats.map((link) => link.eventFormat.name),
      categories: event.categories.map((link) => link.category.name),
      organizer: event.organizer ? event.organizer.name : null,
      venue: event.venue ? event.venue.name : null,
      activityId: event.activityId,
      categoryIds: event.categories.map((link) => link.categoryId),
      organizerId: event.organizerId,
      venueId: event.venueId,
      municipality: event.municipality ? event.municipality.name : null,
      region: event.municipality ? event.municipality.region.name : null,
      country: event.municipality ? event.municipality.region.country.name : null,
      tags: event.tags.map((eventTag) => eventTag.tag.name),
      media: [],
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
