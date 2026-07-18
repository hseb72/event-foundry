import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

/**
 * Mise à jour de la participation (FSPEC.06). Les trois axes sont indépendants ; les champs
 * omis conservent leur valeur actuelle. Aucun n'est déduit d'un autre.
 */
export class UpdateParticipationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  interested?: boolean;

  @ApiPropertyOptional({ enum: ReservationStatus })
  @IsOptional()
  @IsEnum(ReservationStatus)
  reservationStatus?: ReservationStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
