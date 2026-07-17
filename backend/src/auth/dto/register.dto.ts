import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'joueur@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'un-mot-de-passe-solide' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: 'Joueur MTG' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName!: string;
}
