import { ApiProperty } from '@nestjs/swagger';

export class ParticipationResponseDto {
  @ApiProperty({ format: 'uuid' })
  eventId!: string;

  @ApiProperty()
  interested!: boolean;

  @ApiProperty({ enum: ['NONE', 'RESERVED', 'WAITLIST', 'CANCELLED'] })
  reservationStatus!: string;

  @ApiProperty({ enum: ['NONE', 'PENDING', 'PAID', 'REFUNDED'] })
  paymentStatus!: string;

  @ApiProperty({
    description: "true si une participation existe (l'événement est dans le calendrier).",
  })
  active!: boolean;
}
