import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { ResendVerificationDto, VerifyEmailDto } from '../dto/account.dto';
import { AccountLifecycleService } from '../services/account-lifecycle.service';

/**
 * Cycle de vie du compte (FSPEC.18). Endpoints publics par nature (l'utilisateur suit un lien reçu
 * par e-mail, potentiellement sans session). Les réponses restent neutres (pas d'énumération).
 */
@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(private readonly lifecycle: AccountLifecycleService) {}

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: "Adresse vérifiée ; le compte devient actif." })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    await this.lifecycle.verifyEmail(dto.token);
    return { verified: true };
  }

  @Public()
  @Post('verify-email/resend')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOkResponse({ description: 'Nouveau lien envoyé si le compte existe et attend une vérification.' })
  async resend(@Body() dto: ResendVerificationDto): Promise<{ accepted: boolean }> {
    await this.lifecycle.resendVerification(dto.email);
    return { accepted: true };
  }
}
