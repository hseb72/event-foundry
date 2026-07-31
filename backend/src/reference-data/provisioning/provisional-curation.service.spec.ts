import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProvisionalCurationRepository } from './provisional-curation.repository';
import { ProvisionalCurationService } from './provisional-curation.service';

describe('ProvisionalCurationService (curation — ADR.24)', () => {
  let repository: jest.Mocked<Pick<ProvisionalCurationRepository, 'list' | 'confirm' | 'remove'>>;
  let service: ProvisionalCurationService;

  beforeEach(() => {
    repository = { list: jest.fn(), confirm: jest.fn(), remove: jest.fn() };
    service = new ProvisionalCurationService(repository as unknown as ProvisionalCurationRepository);
  });

  it('confirme une entrée (lève le drapeau provisoire)', async () => {
    repository.confirm.mockResolvedValue(undefined);
    await service.confirm('activity', 'a-1');
    expect(repository.confirm).toHaveBeenCalledWith('activity', 'a-1');
  });

  it('convertit une contrainte de clé étrangère en conflit à la suppression', async () => {
    repository.remove.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK', { code: 'P2003', clientVersion: '7' }),
    );
    await expect(service.remove('venue', 'v-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
