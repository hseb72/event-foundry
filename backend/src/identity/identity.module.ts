import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { IdentityAdminController } from './controllers/identity-admin.controller';
import { IdentityController } from './controllers/identity.controller';
import { IDENTITY_SERVICE } from './interfaces/identity-service.interface';
import { OrganizationAddressesController } from './organization-addresses/organization-addresses.controller';
import { OrganizationAddressesService } from './organization-addresses/organization-addresses.service';
import { OrganizationAddressRepository } from './organization-addresses/organization-address.repository';
import { IdentityRepository } from './repositories/identity.repository';
import { IdentityAdminService } from './services/identity-admin.service';
import { IdentityService } from './services/identity.service';
import { TokenService } from './services/token.service';

/**
 * Domaine Identity (TSPEC.06) : rôles, permissions, expériences, organisations et contexte actif.
 * Fondation de la plateforme, sans dépendance à un domaine métier. Exporte le contrat
 * IIdentityService et TokenService (émission des jetons) consommés par le module Auth.
 */
@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [IdentityController, IdentityAdminController, OrganizationAddressesController],
  providers: [
    IdentityService,
    { provide: IDENTITY_SERVICE, useExisting: IdentityService },
    IdentityAdminService,
    IdentityRepository,
    OrganizationAddressesService,
    OrganizationAddressRepository,
    TokenService,
  ],
  exports: [IDENTITY_SERVICE, TokenService],
})
export class IdentityModule {}
