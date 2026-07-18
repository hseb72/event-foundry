import { Injectable } from '@nestjs/common';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { EventsService } from '../../events/services/events.service';
import { ParticipationResponseDto } from '../dto/participation-response.dto';
import { UpdateParticipationDto } from '../dto/update-participation.dto';
import { UserParticipationRepository } from '../repositories/user-participation.repository';

@Injectable()
export class ParticipationService {
  constructor(
    private readonly repository: UserParticipationRepository,
    private readonly eventsService: EventsService,
  ) {}

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
      return {
        eventId,
        interested: false,
        reservationStatus: ReservationStatus.NONE,
        paymentStatus: PaymentStatus.NONE,
        active: false,
      };
    }

    const saved = await this.repository.upsert(userId, eventId, {
      interested,
      reservationStatus,
      paymentStatus,
    });
    return {
      eventId,
      interested: saved.interested,
      reservationStatus: saved.reservationStatus,
      paymentStatus: saved.paymentStatus,
      active: true,
    };
  }
}
