import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';

/** Délégué Prisma d'un référentiel (supporte le filtre is_active et un tri). */
export interface ReferentialDelegate<E> {
  findUnique(args: { where: { id: string } }): Promise<E | null>;
  findMany(args?: { where?: object; orderBy?: object }): Promise<E[]>;
  create(args: { data: object }): Promise<E>;
  update(args: { where: { id: string }; data: object }): Promise<E>;
}

/**
 * Base commune des Repositories de référentiels (TSPEC.01, FSPEC.07).
 *
 * Ajoute la liste filtrée par activation et la désactivation logique, en plus des
 * opérations de `BaseRepository`. Ne contient aucune logique métier.
 */
export abstract class ReferentialRepository<E> extends BaseRepository<E> {
  protected abstract get refDelegate(): ReferentialDelegate<E>;
  protected orderBy: object = { name: 'asc' };

  protected getDelegate(): CrudDelegate<E> {
    return this.refDelegate as unknown as CrudDelegate<E>;
  }

  /** Par défaut, seules les valeurs actives sont retournées. */
  list(includeInactive: boolean): Promise<E[]> {
    return this.refDelegate.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: this.orderBy,
    });
  }

  deactivate(id: string): Promise<E> {
    return this.refDelegate.update({ where: { id }, data: { isActive: false } });
  }
}
