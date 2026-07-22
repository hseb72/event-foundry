import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AccountController } from './controllers/account.controller';
import { AccountRepository } from './repositories/account.repository';
import { AccountLifecycleService } from './services/account-lifecycle.service';
import { AccountLinkMailer } from './services/account-link-mailer.service';
import { AccountSecurityService } from './services/account-security.service';
import { SecurityAuditService } from './services/security-audit.service';

/**
 * Module Account (FSPEC.18 — Identity & Account Management) : cycle de vie du compte (vérification
 * d'e-mail, jetons à usage unique), opérations de sécurité (mots de passe, changement d'e-mail) et
 * journal d'audit. Exporte ses services vers Auth (inscription/connexion auditées) sans dépendre
 * de lui.
 */
@Module({
  imports: [MailModule],
  controllers: [AccountController],
  providers: [
    AccountLifecycleService,
    AccountSecurityService,
    AccountLinkMailer,
    SecurityAuditService,
    AccountRepository,
  ],
  exports: [AccountLifecycleService, SecurityAuditService],
})
export class AccountModule {}
