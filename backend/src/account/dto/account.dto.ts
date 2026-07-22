import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: "Jeton reçu par e-mail (lien de vérification)." })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ description: "Adresse e-mail du compte à re-vérifier." })
  @IsEmail()
  email!: string;
}
