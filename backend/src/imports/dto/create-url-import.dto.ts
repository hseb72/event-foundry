import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, MaxLength } from 'class-validator';

/** Import par URL (capture d'une page — ADR.13). Extraction déterministe schema.org (JSON-LD). */
export class CreateUrlImportDto {
  @ApiProperty({ description: 'URL http(s) de la page d’événement à capturer.' })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  url!: string;
}
