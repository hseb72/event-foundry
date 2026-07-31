import { ApiProperty } from '@nestjs/swagger';

/** Paire de jetons retournée par register / login / refresh. */
export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ default: 'Bearer' })
  tokenType = 'Bearer';
}
