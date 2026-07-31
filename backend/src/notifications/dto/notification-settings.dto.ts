import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type {
  NotificationGlobalSettings,
  NotificationUserPreferences,
  VectorChoice,
} from '../domain/notification-routing';

const VECTOR_CHOICES: VectorChoice[] = ['none', 'email', 'push'];

class VectorsDto {
  @ApiProperty() @IsBoolean() email!: boolean;
  @ApiProperty() @IsBoolean() push!: boolean;
}

class FrequenciesDto {
  @ApiProperty() @IsBoolean() immediate!: boolean;
  @ApiProperty() @IsBoolean() daily!: boolean;
  @ApiProperty() @IsBoolean() weekly!: boolean;
}

/** Réglages globaux (Operator) : vecteurs et pistes de fréquence activés (in-app toujours actif). */
export class NotificationSettingsDto implements NotificationGlobalSettings {
  @ApiProperty({ type: VectorsDto })
  @ValidateNested()
  @Type(() => VectorsDto)
  vectors!: VectorsDto;

  @ApiProperty({ type: FrequenciesDto })
  @ValidateNested()
  @Type(() => FrequenciesDto)
  frequencies!: FrequenciesDto;
}

/** Préférences individuelles : un vecteur (ou « aucun ») par piste de fréquence. */
export class NotificationPreferencesDto implements NotificationUserPreferences {
  @ApiProperty({ enum: VECTOR_CHOICES })
  @IsIn(VECTOR_CHOICES)
  immediate!: VectorChoice;

  @ApiProperty({ enum: VECTOR_CHOICES })
  @IsIn(VECTOR_CHOICES)
  daily!: VectorChoice;

  @ApiProperty({ enum: VECTOR_CHOICES })
  @IsIn(VECTOR_CHOICES)
  weekly!: VectorChoice;
}
