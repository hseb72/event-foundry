import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ProvisionalCurationRepository,
  type ProvisionalEntry,
  type ProvisionalType,
} from './provisional-curation.repository';

/** Codes Prisma indiquant qu'une suppression est bloquée par une référence (RESTRICT). */
const REFERENCED_CODES = new Set(['P2003', 'P2014']);

/**
 * Curation des référentiels provisoires (ADR.24). Liste les entrées auto-créées lors des imports,
 * permet de les **confirmer** (curées) ou de les **supprimer**. La suppression est refusée
 * (409 Conflict) si un événement référence encore l'entrée (RESTRICT).
 */
@Injectable()
export class ProvisionalCurationService {
  constructor(private readonly repository: ProvisionalCurationRepository) {}

  list(): Promise<ProvisionalEntry[]> {
    return this.repository.list();
  }

  confirm(type: ProvisionalType, id: string): Promise<void> {
    return this.repository.confirm(type, id);
  }

  async remove(type: ProvisionalType, id: string): Promise<void> {
    try {
      await this.repository.remove(type, id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && REFERENCED_CODES.has(error.code)) {
        throw new ConflictException(
          'Suppression impossible : ce référentiel est référencé par un événement.',
        );
      }
      throw error;
    }
  }
}
