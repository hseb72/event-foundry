import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { EventsService } from '../../events/services/events.service';
import type { EventBus } from '../../platform/event-bus/event-bus';
import { UserParticipationRepository } from '../repositories/user-participation.repository';
import { ParticipationService } from './participation.service';

describe('ParticipationService', () => {
  let repo: {
    findByUserAndEvent: jest.Mock;
    upsert: jest.Mock;
    deleteByUserAndEvent: jest.Mock;
  };
  let eventsService: { getOrThrow: jest.Mock };
  let eventBus: { publish: jest.Mock; subscribe: jest.Mock };
  let service: ParticipationService;

  beforeEach(() => {
    repo = {
      findByUserAndEvent: jest.fn(),
      upsert: jest.fn(),
      deleteByUserAndEvent: jest.fn().mockResolvedValue(undefined),
    };
    eventsService = { getOrThrow: jest.fn().mockResolvedValue({ id: 'e1' }) };
    eventBus = { publish: jest.fn(), subscribe: jest.fn() };
    service = new ParticipationService(
      repo as unknown as UserParticipationRepository,
      eventsService as unknown as EventsService,
      eventBus as unknown as EventBus,
    );
  });

  it('crée une participation quand un axe devient non neutre', async () => {
    repo.findByUserAndEvent.mockResolvedValue(null);
    repo.upsert.mockResolvedValue({
      interested: true,
      reservationStatus: ReservationStatus.NONE,
      paymentStatus: PaymentStatus.NONE,
    });

    const result = await service.update('u1', 'e1', { interested: true });

    expect(result.active).toBe(true);
    expect(repo.upsert).toHaveBeenCalledWith('u1', 'e1', {
      interested: true,
      reservationStatus: ReservationStatus.NONE,
      paymentStatus: PaymentStatus.NONE,
    });
    // Publie le fait « participation modifiée » sur le bus (ADR.12 §5).
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'participation.changed',
        payload: expect.objectContaining({ userId: 'u1', eventId: 'e1', active: true }),
      }),
    );
  });

  it('supprime la participation quand tout redevient neutre', async () => {
    repo.findByUserAndEvent.mockResolvedValue({
      interested: true,
      reservationStatus: ReservationStatus.NONE,
      paymentStatus: PaymentStatus.NONE,
    });

    const result = await service.update('u1', 'e1', { interested: false });

    expect(result.active).toBe(false);
    expect(repo.deleteByUserAndEvent).toHaveBeenCalledWith('u1', 'e1');
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('ne supprime rien si aucune participation n\'existait', async () => {
    repo.findByUserAndEvent.mockResolvedValue(null);

    const result = await service.update('u1', 'e1', { interested: false });

    expect(result.active).toBe(false);
    expect(repo.deleteByUserAndEvent).not.toHaveBeenCalled();
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
