import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { EventMediaDto, MAX_MEDIA_BYTES } from '../dto/event-media.dto';
import { EventMediaService } from '../services/event-media.service';

/**
 * Médias (images) d'un Event du **catalogue**. Écritures réservées à `event.update` (Organizer) :
 * il s'agit de curation d'une donnée partagée. Un événement **privé** s'illustre par les routes
 * `events/me/private/:id/media`, où la propriété tient lieu d'autorisation (FSPEC.22 §15).
 * Le fichier est stocké dans MinIO ; l'API ne renvoie que des URL présignées temporaires.
 */
@ApiTags('events')
@ApiBearerAuth()
@Controller('events/:eventId/media')
export class EventMediaController {
  constructor(private readonly service: EventMediaService) {}

  @Post()
  @RequirePermissions('event.update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_MEDIA_BYTES } }))
  @ApiCreatedResponse({ type: EventMediaDto })
  upload(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EventMediaDto> {
    return this.service.upload(eventId, file);
  }

  @Delete(':mediaId')
  @RequirePermissions('event.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ): Promise<void> {
    return this.service.remove(eventId, mediaId);
  }
}
