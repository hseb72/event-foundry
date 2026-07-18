import { Injectable } from '@nestjs/common';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import type { UserParticipation } from '../entities/user-participation.entity';

export interface ParticipationState {
  interested: boolean;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
}

@Injectable()
export class UserParticipationRepository extends BaseRepository<UserParticipation> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<UserParticipation> {
    return this.prisma.userParticipation as unknown as CrudDelegate<UserParticipation>;
  }

  findByUserAndEvent(userId: string, eventId: string): Promise<UserParticipation | null> {
    return this.prisma.userParticipation.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
  }

  upsert(userId: string, eventId: string, state: ParticipationState): Promise<UserParticipation> {
    return this.prisma.userParticipation.upsert({
      where: { userId_eventId: { userId, eventId } },
      update: state,
      create: { userId, eventId, ...state },
    });
  }

  async deleteByUserAndEvent(userId: string, eventId: string): Promise<void> {
    await this.prisma.userParticipation.deleteMany({ where: { userId, eventId } });
  }
}
