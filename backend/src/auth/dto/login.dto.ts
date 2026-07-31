import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'joueur@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ description: 'Code MFA (TOTP ou code de récupération) si le MFA est activé.' })
  @IsOptional()
  @IsString()
  mfaCode?: string;
}
