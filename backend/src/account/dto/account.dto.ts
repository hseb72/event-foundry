import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel (réauthentification — IAM-008).' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Adresse e-mail du compte à récupérer.' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Jeton du lien de récupération.' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class RequestEmailChangeDto {
  @ApiProperty({ description: 'Mot de passe actuel (réauthentification — IAM-008).' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ description: 'Nouvelle adresse e-mail (sera vérifiée avant application).' })
  @IsEmail()
  newEmail!: string;
}

export class ConfirmEmailChangeDto {
  @ApiProperty({ description: 'Jeton reçu sur la nouvelle adresse.' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
