import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { MailModule } from '../mail/mail.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

/**
 * Domaine Organisations (FSPEC.19) : création self-service, gestion des collaborateurs et de leurs
 * fonctions, transfert de propriété, invitations. Importe AccountModule (historisation) et MailModule
 * (envoi des liens d'invitation).
 */
@Module({
  imports: [AccountModule, MailModule],
  controllers: [OrganizationsController, InvitationsController],
  providers: [OrganizationsService, InvitationsService, OrganizationsRepository],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
