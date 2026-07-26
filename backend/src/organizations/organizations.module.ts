import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

/**
 * Domaine Organisations (FSPEC.19) : création self-service, gestion des collaborateurs et de leurs
 * fonctions, transfert de propriété. Importe AccountModule pour l'historisation (SecurityAuditService).
 */
@Module({
  imports: [AccountModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationsRepository],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
