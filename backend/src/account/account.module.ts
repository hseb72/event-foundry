import { Module } from '@nestjs/common';
import { AccountController } from './controllers/account.controller';
import { AccountRepository } from './repositories/account.repository';
import { AccountLifecycleService } from './services/account-lifecycle.service';
import { SecurityAuditService } from './services/security-audit.service';

/**
 * Module Account (FSPEC.18 — Identity & Account Management) : cycle de vie du compte (vérification
 * d'e-mail, jetons à usage unique) et journal d'audit sécurité. Exporte ses services vers Auth
 * (inscription/connexion auditées) sans dépendre de lui.
 */
@Module({
  controllers: [AccountController],
  providers: [AccountLifecycleService, SecurityAuditService, AccountRepository],
  exports: [AccountLifecycleService, SecurityAuditService],
})
export class AccountModule {}
