import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecretStatus } from '@prisma/client';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

/** Mise à jour de la configuration mail (SMTP). Le mot de passe est stocké comme secret. */
export class UpdateMailConfigDto {
  @ApiProperty({ example: 'smtp.example.com' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host!: string;

  @ApiProperty({ example: 587 })
  @IsInt()
  @Min(1)
  @Max(65535)
  port!: number;

  @ApiProperty({ description: 'Connexion sécurisée (TLS).' })
  @IsBoolean()
  secure!: boolean;

  @ApiProperty({ example: 'no-reply@eventfoundry.app' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  from!: string;

  @ApiPropertyOptional({ description: "Identifiant SMTP (non secret)." })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @ApiPropertyOptional({ description: 'Mot de passe SMTP (stocké comme secret). Omis = inchangé.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  password?: string;
}

/** Vue de la configuration mail (le mot de passe n'est jamais renvoyé). */
export class MailConfigDto {
  @ApiProperty()
  host!: string;

  @ApiProperty()
  port!: number;

  @ApiProperty()
  secure!: boolean;

  @ApiProperty()
  from!: string;

  @ApiPropertyOptional({ nullable: true })
  username!: string | null;

  @ApiProperty({ description: 'Mot de passe configuré (masqué).' })
  passwordMasked!: string | null;

  @ApiProperty({ enum: SecretStatus })
  status!: SecretStatus;
}
