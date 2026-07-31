import { ALL_EVENTS, makeDomainEvent } from './event-bus';
import { InProcessEventBus } from './in-process-event-bus';

/** Laisse le micro-ordonnanceur exécuter le dispatch asynchrone du bus. */
const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('InProcessEventBus (bus d’événements — ADR.12 §5)', () => {
  let bus: InProcessEventBus;

  beforeEach(() => {
    bus = new InProcessEventBus();
  });

  it('livre un événement aux abonnés de son nom et aux abonnés « * »', async () => {
    const byName = jest.fn();
    const all = jest.fn();
    bus.subscribe('import.completed', byName);
    bus.subscribe(ALL_EVENTS, all);

    const event = makeDomainEvent('import.completed', { importJobId: 'j1' }, 'corr-1');
    bus.publish(event);
    await flush();

    expect(byName).toHaveBeenCalledWith(event);
    expect(all).toHaveBeenCalledWith(event);
  });

  it('n’appelle pas les abonnés d’un autre nom', async () => {
    const other = jest.fn();
    bus.subscribe('event.published', other);
    bus.publish(makeDomainEvent('import.completed', {}, 'c'));
    await flush();
    expect(other).not.toHaveBeenCalled();
  });

  it('isole l’échec d’un abonné (les autres reçoivent quand même l’événement)', async () => {
    const failing = jest.fn().mockRejectedValue(new Error('boom'));
    const ok = jest.fn();
    bus.subscribe('x', failing);
    bus.subscribe('x', ok);

    expect(() => bus.publish(makeDomainEvent('x', {}, 'c'))).not.toThrow();
    await flush();

    expect(failing).toHaveBeenCalled();
    expect(ok).toHaveBeenCalled();
  });

  it('makeDomainEvent renseigne occurredAt (UTC) et le correlationId fourni', () => {
    const event = makeDomainEvent('event.published', { eventId: 'e1' }, 'corr-9');
    expect(event.correlationId).toBe('corr-9');
    expect(event.name).toBe('event.published');
    expect(() => new Date(event.occurredAt).toISOString()).not.toThrow();
  });
});
