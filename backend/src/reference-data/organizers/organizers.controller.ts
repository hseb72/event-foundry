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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../users/constants/role.constants';
import { CreateOrganizerDto, OrganizerResponseDto, UpdateOrganizerDto } from './organizer.dto';
import { OrganizerMapper } from './organizer.mapper';
import { OrganizersService } from './organizers.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly service: OrganizersService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<OrganizerResponseDto[]> {
    const organizers = await this.service.list(includeInactive === 'true');
    return organizers.map(OrganizerMapper.toResponse);
  }

  @Post()
  @Roles(SystemRole.ADMIN)
  async create(@Body() dto: CreateOrganizerDto): Promise<OrganizerResponseDto> {
    return OrganizerMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @Roles(SystemRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizerDto,
  ): Promise<OrganizerResponseDto> {
    return OrganizerMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<OrganizerResponseDto> {
    return OrganizerMapper.toResponse(await this.service.deactivate(id));
  }
}
