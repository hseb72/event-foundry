import { Inject, Injectable } from '@nestjs/common';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { EventsService } from '../../events/services/events.service';
import { DOMAIN_EVENTS, type ParticipationChangedPayload } from '../../platform/event-bus/domain-event';
import { EVENT_BUS, makeDomainEvent, type EventBus } from '../../platform/event-bus/event-bus';
import { ParticipationResponseDto } from '../dto/participation-response.dto';
import { UpdateParticipationDto } from '../dto/update-participation.dto';
import { UserParticipationRepository } from '../repositories/user-participation.repository';

@Injectable()
export class ParticipationService {
  constructor(
    private readonly repository: UserParticipationRepository,
    private readonly eventsService: EventsService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  /** Publie le fait « participation modifiée » (ADR.12 §5). Best-effort. */
  private emitChanged(userId: string, result: ParticipationResponseDto): void {
    this.eventBus.publish(
      makeDomainEvent<ParticipationChangedPayload>(DOMAIN_EVENTS.PARTICIPATION_CHANGED, {
        userId,
        eventId: result.eventId,
        interested: result.interested,
        reservationStatus: result.reservationStatus,
        paymentStatus: result.paymentStatus,
        active: result.active,
      }),
    );
  }

  /**
   * Applique la mise à jour (FSPEC.06). Une participation existe dès qu'un axe est non
   * neutre ; si tout redevient neutre, elle est supprimée (l'événement quitte le calendrier
   * mais reste trouvable en recherche).
   */
  async update(
    userId: string,
    eventId: string,
    dto: UpdateParticipationDto,
  ): Promise<ParticipationResponseDto> {
    // Valide que l'Event existe et n'est pas supprimé logiquement.
    await this.eventsService.getOrThrow(eventId);

    const existing = await this.repository.findByUserAndEvent(userId, eventId);
    const interested = dto.interested ?? existing?.interested ?? false;
    const reservationStatus =
      dto.reservationStatus ?? existing?.reservationStatus ?? ReservationStatus.NONE;
    const paymentStatus = dto.paymentStatus ?? existing?.paymentStatus ?? PaymentStatus.NONE;

    const isNeutral =
      !interested &&
      reservationStatus === ReservationStatus.NONE &&
      paymentStatus === PaymentStatus.NONE;

    if (isNeutral) {
      if (existing) {
        await this.repository.deleteByUserAndEvent(userId, eventId);
      }
      const result: ParticipationResponseDto = {
        eventId,
        interested: false,
        reservationStatus: ReservationStatus.NONE,
        paymentStatus: PaymentStatus.NONE,
        active: false,
      };
      // N'émet que si une participation existait (transition réelle : retrait du calendrier).
      if (existing) {
        this.emitChanged(userId, result);
      }
      return result;
    }

    const saved = await this.repository.upsert(userId, eventId, {
      interested,
      reservationStatus,
      paymentStatus,
    });
    const result: ParticipationResponseDto = {
      eventId,
      interested: saved.interested,
      reservationStatus: saved.reservationStatus,
      paymentStatus: saved.paymentStatus,
      active: true,
    };
    this.emitChanged(userId, result);
    return result;
  }
}
