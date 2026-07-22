import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicRepository } from './public.repository';
import { PublicService } from './public.service';

/**
 * Vitrine publique (page de garde) : point d'accès **non authentifié** au catalogue, pour présenter
 * des événements « à la Une » à un visiteur anonyme et l'inviter à se connecter ou à créer un compte.
 * Lecture seule sur les seuls événements publiés ; aucun contexte utilisateur n'est exposé.
 */
@Module({
  controllers: [PublicController],
  providers: [PublicService, PublicRepository],
})
export class PublicModule {}
