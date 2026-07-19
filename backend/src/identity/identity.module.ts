import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IdentityController } from './controllers/identity.controller';
import { IDENTITY_SERVICE } from './interfaces/identity-service.interface';
import { IdentityRepository } from './repositories/identity.repository';
import { IdentityService } from './services/identity.service';
import { TokenService } from './services/token.service';

/**
 * Domaine Identity (TSPEC.06) : rôles, permissions, expériences, organisations et contexte actif.
 * Fondation de la plateforme, sans dépendance à un domaine métier. Exporte le contrat
 * IIdentityService et TokenService (émission des jetons) consommés par le module Auth.
 */
@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    { provide: IDENTITY_SERVICE, useExisting: IdentityService },
    IdentityRepository,
    TokenService,
  ],
  exports: [IDENTITY_SERVICE, TokenService],
})
export class IdentityModule {}
