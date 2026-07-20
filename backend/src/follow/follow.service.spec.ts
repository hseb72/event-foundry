import type { Follow } from '@prisma/client';
import { FollowTargetType } from '@prisma/client';
import { FollowRepository } from './follow.repository';
import { FollowService } from './follow.service';

describe('FollowService (ADR.19 / FSPEC.06)', () => {
  let repository: jest.Mocked<
    Pick<FollowRepository, 'upsertActive' | 'softDelete' | 'listActiveByUser' | 'listFollowerIds'>
  >;
  let service: FollowService;

  beforeEach(() => {
    repository = {
      upsertActive: jest.fn(),
      softDelete: jest.fn(),
      listActiveByUser: jest.fn(),
      listFollowerIds: jest.fn(),
    };
    service = new FollowService(repository as unknown as FollowRepository);
  });

  it('suivre est idempotent (upsert : crée ou réactive)', async () => {
    repository.upsertActive.mockResolvedValue({ id: 'f-1' } as Follow);
    await service.follow('user-1', FollowTargetType.ORGANIZER, 'org-1');
    expect(repository.upsertActive).toHaveBeenCalledWith('user-1', FollowTargetType.ORGANIZER, 'org-1');
  });

  it('ne plus suivre délègue une suppression logique', async () => {
    repository.softDelete.mockResolvedValue();
    await service.unfollow('user-1', FollowTargetType.VENUE, 'venue-1');
    expect(repository.softDelete).toHaveBeenCalledWith('user-1', FollowTargetType.VENUE, 'venue-1');
  });

  it('liste les suivis actifs de l’utilisateur', async () => {
    repository.listActiveByUser.mockResolvedValue([]);
    await service.listByUser('user-1');
    expect(repository.listActiveByUser).toHaveBeenCalledWith('user-1');
  });

  it('expose les abonnés d’un objet (notifications information Explorer)', async () => {
    repository.listFollowerIds.mockResolvedValue(['user-1', 'user-2']);
    const followers = await service.listFollowerIds(FollowTargetType.ACTIVITY, 'act-1');
    expect(followers).toEqual(['user-1', 'user-2']);
  });
});
