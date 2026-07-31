import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { NotificationSettingsDto } from '../dto/notification-settings.dto';
import { NotificationSettingsService } from '../services/notification-settings.service';

/**
 * Réglages globaux des notifications (Operator — FSPEC.04). Active/désactive globalement les vecteurs
 * (email/push) et les pistes de fréquence. Réservé à `pipeline.manage`. Écran OPE-005.
 */
@ApiTags('notification-settings')
@ApiBearerAuth()
@RequirePermissions('pipeline.manage')
@Controller('admin/config/notifications')
export class NotificationSettingsController {
  constructor(private readonly settings: NotificationSettingsService) {}

  @Get()
  @ApiOkResponse({ type: NotificationSettingsDto })
  get(): Promise<NotificationSettingsDto> {
    return this.settings.get();
  }

  @Put()
  @ApiOkResponse({ type: NotificationSettingsDto })
  update(@Body() dto: NotificationSettingsDto): Promise<NotificationSettingsDto> {
    return this.settings.update(dto);
  }
}
