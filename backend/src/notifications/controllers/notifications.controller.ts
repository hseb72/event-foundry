import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NotificationStatus } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { NotificationDto, UnreadCountDto } from '../dto/notification-response.dto';
import { NotificationPreferencesDto } from '../dto/notification-settings.dto';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationsService } from '../services/notifications.service';

class NotificationQueryDto {
  @IsOptional()
  @IsIn(['UNREAD', 'READ'])
  status?: NotificationStatus;
}

/**
 * Notifications internes de l'utilisateur courant (EPIC 08 / UISPEC EXP-006). Toujours dans le
 * contexte de l'identité : un utilisateur ne voit que ses propres notifications. Ouvert à tout
 * utilisateur authentifié (aucune permission spécifique — ressource strictement personnelle).
 */
@ApiTags('notifications')
@ApiBearerAuth()
@Controller('me/notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  /** Préférences de notifications (vecteur par piste de fréquence — FSPEC.04). */
  @Get('preferences')
  @ApiOkResponse({ type: NotificationPreferencesDto })
  getPreferences(@CurrentUser() user: AuthenticatedUser): Promise<NotificationPreferencesDto> {
    return this.preferences.get(user.userId);
  }

  @Put('preferences')
  @ApiOkResponse({ type: NotificationPreferencesDto })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: NotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.preferences.update(user.userId, dto);
  }

  @Get()
  @ApiOkResponse({ type: [NotificationDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationDto[]> {
    const items = await this.notifications.list(user.userId, query.status);
    return items.map((item) => NotificationDto.from(item));
  }

  @Get('unread-count')
  @ApiOkResponse({ type: UnreadCountDto })
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<UnreadCountDto> {
    return { count: await this.notifications.unreadCount(user.userId) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async readAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notifications.markAllRead(user.userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async read(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.notifications.markRead(user.userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.notifications.remove(user.userId, id);
  }
}
