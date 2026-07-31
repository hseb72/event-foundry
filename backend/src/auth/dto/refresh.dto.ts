import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Jeton de rafraîchissement obtenu au login.' })
  @IsJWT()
  @IsNotEmpty()
  refreshToken!: string;
}
