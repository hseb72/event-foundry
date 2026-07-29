import { Module } from '@nestjs/common';
import { FollowModule } from '../follow/follow.module';
import { RecommendationController } from './controllers/recommendation.controller';
import { RecommendationRepository } from './repositories/recommendation.repository';
import { RecommendationService } from './services/recommendation.service';
import { EventCoversModule } from '../event-covers/event-covers.module';

/**
 * Moteur de recommandation (TSPEC.02 / ADR.09) : sélection déterministe et explicable d'événements
 * du Catalog par une chaîne de règles métier. Ne possède aucune donnée d'événement ; ne persiste que
 * les retours utilisateur. Lecture seule sur le Catalog (via son propre Repository, Prisma confiné).
 */
@Module({
  imports: [FollowModule, EventCoversModule],
  controllers: [RecommendationController],
  providers: [RecommendationService, RecommendationRepository],
})
export class RecommendationModule {}
