import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import { ParticipationResponseDto } from '../dto/participation-response.dto';
import { UpdateParticipationDto } from '../dto/update-participation.dto';
import { ParticipationService } from '../services/participation.service';

@ApiTags('participation')
@ApiBearerAuth()
@Controller('events')
export class ParticipationController {
  constructor(private readonly service: ParticipationService) {}

  @Put(':id/participation')
  @ApiOkResponse({ type: ParticipationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateParticipationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ParticipationResponseDto> {
    return this.service.update(user.userId, eventId, dto);
  }
}
