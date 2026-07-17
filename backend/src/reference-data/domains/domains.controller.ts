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
import { CreateDomainDto, DomainResponseDto, UpdateDomainDto } from './domain.dto';
import { DomainMapper } from './domain.mapper';
import { DomainsService } from './domains.service';

@ApiTags('reference-data')
@ApiBearerAuth()
@Controller('domains')
export class DomainsController {
  constructor(private readonly service: DomainsService) {}

  @Get()
  async list(@Query('includeInactive') includeInactive?: string): Promise<DomainResponseDto[]> {
    const domains = await this.service.list(includeInactive === 'true');
    return domains.map(DomainMapper.toResponse);
  }

  @Post()
  @Roles(SystemRole.ADMIN)
  async create(@Body() dto: CreateDomainDto): Promise<DomainResponseDto> {
    return DomainMapper.toResponse(await this.service.create(dto));
  }

  @Put(':id')
  @Roles(SystemRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDomainDto,
  ): Promise<DomainResponseDto> {
    return DomainMapper.toResponse(await this.service.update(id, dto));
  }

  @Delete(':id')
  @Roles(SystemRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<DomainResponseDto> {
    return DomainMapper.toResponse(await this.service.deactivate(id));
  }
}
