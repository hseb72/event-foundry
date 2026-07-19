import { ConflictException } from '@nestjs/common';

/**
 * Erreur métier : l'expérience demandée n'est pas débloquée par les rôles de l'utilisateur
 * (métier → 409, TSPEC.07). Les expériences disponibles découlent des rôles (FSPEC.10).
 */
export class ExperienceNotAvailableException extends ConflictException {
  constructor(experience: string) {
    super(`Expérience « ${experience} » non disponible pour cet utilisateur.`);
  }
}
