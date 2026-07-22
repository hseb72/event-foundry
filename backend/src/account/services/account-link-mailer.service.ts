import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Remise des liens de compte (vérification, récupération, changement d'e-mail, invitation) au
 * destinataire. Aucun SMTP en dev : le lien est journalisé (même principe que le canal e-mail des
 * notifications). Une implémentation réelle branchera le serveur de messagerie configuré par
 * l'Operator (FSPEC.17) sans changer les services appelants.
 */
@Injectable()
export class AccountLinkMailer {
  private readonly logger = new Logger(AccountLinkMailer.name);

  constructor(private readonly config: ConfigService) {}

  deliver(email: string, path: string, rawToken: string): void {
    const base = this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:4200');
    this.logger.log(`[email→${email}] ${base}/${path}?token=${rawToken}`);
  }
}
