import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowRepository } from './follow.repository';
import { FollowService } from './follow.service';

/**
 * Domaine Follow (ADR.19 / FSPEC.06) : suivis durables utilisateur → objet. Exporte FollowService
 * pour les consommateurs (recommandations, notifications « information Explorer »).
 */
@Module({
  controllers: [FollowController],
  providers: [FollowService, FollowRepository],
  exports: [FollowService],
})
export class FollowModule {}
