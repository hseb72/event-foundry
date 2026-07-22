import { Module } from '@nestjs/common';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { MailService } from './mail.service';

/**
 * Envoi d'e-mails transactionnels (FSPEC.17 / FSPEC.18). Branche la configuration mail Operator
 * (SMTP + secret) au point d'usage. Exporté vers les domaines qui notifient par e-mail (Account…).
 */
@Module({
  imports: [PlatformConfigModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
