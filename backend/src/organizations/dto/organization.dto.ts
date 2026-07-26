import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ORG_FUNCTIONS, type OrgFunction } from '../organizations.service';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'La Cave aux Cartes' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class ChangeMemberFunctionDto {
  @ApiProperty({ enum: ORG_FUNCTIONS })
  @IsIn(ORG_FUNCTIONS as unknown as string[])
  function!: OrgFunction;
}

export class TransferOwnershipDto {
  @ApiProperty({ description: 'Membre qui devient Owner.' })
  @IsUUID()
  userId!: string;
}
