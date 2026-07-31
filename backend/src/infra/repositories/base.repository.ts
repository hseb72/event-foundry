/**
 * Délégué CRUD minimal exposé par un modèle Prisma.
 * Volontairement structurel : chaque Repository fournit son délégué concret.
 */
export interface CrudDelegate<Entity> {
  findUnique(args: { where: { id: string } }): Promise<Entity | null>;
  findMany(): Promise<Entity[]>;
  create(args: { data: object }): Promise<Entity>;
  update(args: { where: { id: string }; data: object }): Promise<Entity>;
  delete(args: { where: { id: string } }): Promise<Entity>;
}

/**
 * Opérations communes à tous les Repositories (TSPEC.01, TSPEC.02).
 *
 * Ne contient aucune logique métier. Les Repositories spécialisés fournissent leur délégué
 * Prisma via `getDelegate()` et ajoutent uniquement leurs requêtes métier.
 */
export abstract class BaseRepository<Entity> {
  protected abstract getDelegate(): CrudDelegate<Entity>;

  findById(id: string): Promise<Entity | null> {
    return this.getDelegate().findUnique({ where: { id } });
  }

  findAll(): Promise<Entity[]> {
    return this.getDelegate().findMany();
  }

  create(data: object): Promise<Entity> {
    return this.getDelegate().create({ data });
  }

  update(id: string, data: object): Promise<Entity> {
    return this.getDelegate().update({ where: { id }, data });
  }

  delete(id: string): Promise<Entity> {
    return this.getDelegate().delete({ where: { id } });
  }
}
