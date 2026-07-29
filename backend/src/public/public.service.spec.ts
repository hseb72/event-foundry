import type { EventWithRefs } from '../events/entities/event.entity';
import type { EventCoverService } from '../event-covers/services/event-cover.service';
import type { PublicRepository } from './public.repository';
import { PublicService } from './public.service';

const evt = (id: string, lat: number | null, lng: number | null): EventWithRefs =>
  ({
    id,
    source: 'MANUAL',
    status: 'PUBLISHED',
    title: id,
    startsAt: new Date(),
    activity: { name: 'Magic' },
    eventType: null,
    formats: [],
    categories: [],
    subjects: [],
    modalities: [],
    organizer: null,
    venue: lat == null ? null : { name: 'V', latitude: lat, longitude: lng },
    municipality: null,
    tags: [],
  }) as unknown as EventWithRefs;

describe('PublicService — événements « à la Une » (page de garde)', () => {
  let repository: { upcoming: jest.Mock };
  let covers: { attach: jest.Mock };
  let service: PublicService;

  beforeEach(() => {
    repository = { upcoming: jest.fn() };
    // Couvertures : dépendance d'affichage, neutre pour la sélection et le tri testés ici.
    covers = { attach: jest.fn().mockResolvedValue(undefined) };
    service = new PublicService(
      repository as unknown as PublicRepository,
      covers as unknown as EventCoverService,
    );
  });

  it('sans localisation : renvoie les prochains publiés dans l’ordre du repository', async () => {
    repository.upcoming.mockResolvedValue([evt('a', null, null), evt('b', null, null)]);
    const result = await service.featured(8);
    expect(repository.upcoming).toHaveBeenCalledWith(expect.any(Date), 8);
    expect(result.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('avec localisation : trie par proximité, les lieux sans coordonnées en dernier', async () => {
    // Visiteur à Paris (48.85, 2.35). far = Marseille, near = Versailles, nogeo = sans coords.
    repository.upcoming.mockResolvedValue([
      evt('far', 43.3, 5.4),
      evt('nogeo', null, null),
      evt('near', 48.8, 2.13),
    ]);
    const result = await service.featured(3, { latitude: 48.85, longitude: 2.35 });
    expect(result.map((e) => e.id)).toEqual(['near', 'far', 'nogeo']);
  });

  it('avec localisation : récupère une fenêtre large avant de tronquer', async () => {
    repository.upcoming.mockResolvedValue([evt('a', 48.8, 2.1)]);
    await service.featured(4, { latitude: 48.85, longitude: 2.35 });
    // Le take passé au repo est le pool de proximité, pas la taille demandée.
    expect(repository.upcoming.mock.calls[0][1]).toBeGreaterThan(4);
  });
});
