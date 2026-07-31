import { ApiProperty } from '@nestjs/swagger';

/** Représentation publique d'un utilisateur (les Entities ne sont jamais exposées). */
export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: [String] })
  roles!: string[];

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ description: 'Date de création (ISO 8601, UTC).' })
  createdAt!: string;
}
