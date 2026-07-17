import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTextImportDto {
  @ApiProperty({ description: 'Texte brut de l\'annonce à structurer.' })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;
}
