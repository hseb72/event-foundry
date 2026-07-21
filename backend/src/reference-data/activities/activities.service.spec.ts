import type { Activity, Domain } from '@prisma/client';
import { DomainNotFoundException } from '../common/exceptions';
import { ActivitiesService } from './activities.service';
import { ActivityRepository } from './activity.repository';
import { DomainRepository } from '../domains/domain.repository';

describe('ActivitiesService', () => {
  let repository: jest.Mocked<
    Pick<ActivityRepository, 'create' | 'list' | 'listByDomain' | 'listWithAliases' | 'findById'>
  >;
  let domainRepository: jest.Mocked<Pick<DomainRepository, 'findById'>>;
  let service: ActivitiesService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      list: jest.fn(),
      listByDomain: jest.fn(),
      listWithAliases: jest.fn(),
      findById: jest.fn(),
    };
    domainRepository = { findById: jest.fn() };
    service = new ActivitiesService(
      repository as unknown as ActivityRepository,
      domainRepository as unknown as DomainRepository,
    );
  });

  it('rejette la création quand le Domain parent est introuvable', async () => {
    domainRepository.findById.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Magic', domainId: 'missing-domain' }),
    ).rejects.toBeInstanceOf(DomainNotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('crée une Activity quand le Domain parent existe', async () => {
    domainRepository.findById.mockResolvedValue({ id: 'domain-1' } as Domain);
    repository.create.mockResolvedValue({ id: 'activity-1', name: 'Magic' } as Activity);

    const created = await service.create({ name: 'Magic', domainId: 'domain-1' });

    expect(created.id).toBe('activity-1');
    expect(repository.create).toHaveBeenCalledWith({ name: 'Magic', domainId: 'domain-1' });
  });

  it('liste avec alias (résolution alias-aware), en propageant le filtre domaine', async () => {
    repository.listWithAliases.mockResolvedValue([]);
    await service.list(false, 'domain-1');
    expect(repository.listWithAliases).toHaveBeenCalledWith(false, 'domain-1');
  });
});
