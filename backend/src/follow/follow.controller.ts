import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { FollowTargetType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateFollowDto, FollowDto } from './dto/follow.dto';
import { FollowMapper } from './follow.mapper';
import { FollowService } from './follow.service';

/**
 * Suivis (Follow — ADR.19 / FSPEC.06). Routes self-service : tout utilisateur authentifié gère ses
 * propres suivis (aucune permission spécifique — RBAC V2). Les suivis sont user-scopés (CurrentUser).
 */
@ApiTags('follow')
@ApiBearerAuth()
@Controller()
export class FollowController {
  constructor(private readonly service: FollowService) {}

  @Post('follows')
  @ApiCreatedResponse({ type: FollowDto })
  async follow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFollowDto,
  ): Promise<FollowDto> {
    return FollowMapper.toResponse(
      await this.service.follow(user.userId, dto.targetType, dto.targetId),
    );
  }

  @Delete('follows/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'targetType', enum: FollowTargetType })
  async unfollow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('targetType', new ParseEnumPipe(FollowTargetType)) targetType: FollowTargetType,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ): Promise<void> {
    await this.service.unfollow(user.userId, targetType, targetId);
  }

  @Get('me/follows')
  @ApiOkResponse({ type: [FollowDto] })
  async myFollows(@CurrentUser() user: AuthenticatedUser): Promise<FollowDto[]> {
    const follows = await this.service.listByUser(user.userId);
    return follows.map(FollowMapper.toResponse);
  }
}
