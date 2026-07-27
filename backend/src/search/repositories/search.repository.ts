import { Injectable } from '@nestjs/common';
import { EventStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  EVENT_REFS_INCLUDE,
  type EventWithRefsAndParticipation,
} from '../../events/entities/event.entity';
import type { SearchSort } from '../dto/search-query.dto';

/** Document indexable : projection dénormalisée d'un Event publié (colonnes de `search_documents`). */
export interface IndexableDocument {
  eventId: string;
  title: string;
  description: string | null;
  activityId: string;
  activityName: string;
  categoryIds: string[];
  categoryNames: string[];
  formatIds: string[];
  formatNames: string[];
  municipalityId: string | null;
  municipalityName: string | null;
  organizerName: string | null;
  venueName: string | null;
  tagIds: string[];
  tagNames: string[];
  startsAt: Date;
  publishedAt: Date | null;
}

/** Filtre technique de recherche (résolu par la couche service). */
export interface SearchFilter {
  text?: string;
  activityId?: string;
  categoryId?: string;
  municipalityId?: string;
  tagId?: string;
  startsFrom?: Date;
  startsTo?: Date;
  sort: SearchSort;
  skip: number;
  take: number;
}

/** Une valeur de facette de recherche. */
export interface SearchFacet {
  id: string;
  name: string;
  count: number;
}

export interface SearchFacets {
  activities: SearchFacet[];
  categories: SearchFacet[];
  municipalities: SearchFacet[];
  tags: SearchFacet[];
}

/**
 * Persistance et interrogation de l'index de recherche (TSPEC.09). L'index (`search_documents`)
 * est une projection technique des événements publiés du Catalog, jamais source de vérité :
 * il est reconstructible intégralement. Le vecteur plein texte pondéré (A: titre, B: activité /
 * catégorie / tags, C: détails) est calculé en base par PostgreSQL FTS et interrogé via un index
 * GIN. Seul ce Repository accède à PostgreSQL (ADR.02).
 */
@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Charge depuis le Catalog les événements publiés à (ré)indexer, projetés en documents. */
  async loadPublished(eventIds?: string[]): Promise<IndexableDocument[]> {
    const events = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        deletedAt: null,
        ...(eventIds ? { id: { in: eventIds } } : {}),
      },
      include: EVENT_REFS_INCLUDE,
    });
    return events.map((event) => ({
      eventId: event.id,
      title: event.title,
      description: event.description,
      activityId: event.activityId,
      activityName: event.activity.name,
      categoryIds: event.categories.map((link) => link.categoryId),
      categoryNames: event.categories.map((link) => link.category.name),
      formatIds: event.formats.map((link) => link.eventFormatId),
      formatNames: event.formats.map((link) => link.eventFormat.name),
      municipalityId: event.municipalityId,
      municipalityName: event.municipality?.name ?? null,
      organizerName: event.organizer?.name ?? null,
      venueName: event.venue?.name ?? null,
      tagIds: event.tags.map((link) => link.tagId),
      tagNames: event.tags.map((link) => link.tag.name),
      startsAt: event.startsAt,
      publishedAt: event.publishedAt,
    }));
  }

  /** Insère / met à jour des documents, puis recalcule leurs vecteurs plein texte. */
  async upsert(documents: IndexableDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }
    for (const doc of documents) {
      const data = {
        title: doc.title,
        description: doc.description,
        activityId: doc.activityId,
        activityName: doc.activityName,
        categoryIds: doc.categoryIds,
        categoryNames: doc.categoryNames,
        formatIds: doc.formatIds,
        formatNames: doc.formatNames,
        municipalityId: doc.municipalityId,
        municipalityName: doc.municipalityName,
        organizerName: doc.organizerName,
        venueName: doc.venueName,
        tagIds: doc.tagIds,
        tagNames: doc.tagNames,
        startsAt: doc.startsAt,
        publishedAt: doc.publishedAt,
        indexedAt: new Date(),
      };
      await this.prisma.searchDocument.upsert({
        where: { eventId: doc.eventId },
        create: { eventId: doc.eventId, ...data },
        update: data,
      });
    }
    await this.refreshVectors(documents.map((doc) => doc.eventId));
  }

  /** Retire un document de l'index (dépublication / archivage / suppression). */
  async remove(eventId: string): Promise<void> {
    await this.prisma.searchDocument.deleteMany({ where: { eventId } });
  }

  /** Vide entièrement l'index (préalable à une reconstruction). */
  async clear(): Promise<void> {
    await this.prisma.searchDocument.deleteMany({});
  }

  count(): Promise<number> {
    return this.prisma.searchDocument.count();
  }

  /**
   * Recalcule le `search_vector` pondéré des documents ciblés (ou de tout l'index si `eventIds`
   * est omis). Le vecteur est confiné à la base : PostgreSQL FTS reste l'unique moteur de calcul.
   */
  private async refreshVectors(eventIds?: string[]): Promise<void> {
    const scope = eventIds
      ? Prisma.sql`WHERE event_id IN (${Prisma.join(eventIds.map((id) => Prisma.sql`${id}::uuid`))})`
      : Prisma.empty;
    await this.prisma.$executeRaw`
      UPDATE search_documents SET search_vector =
        setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('french',
          coalesce(activity_name, '') || ' ' || array_to_string(category_names, ' ') || ' ' ||
          array_to_string(tag_names, ' ')), 'B') ||
        setweight(to_tsvector('french',
          coalesce(description, '') || ' ' || coalesce(organizer_name, '') || ' ' ||
          coalesce(venue_name, '') || ' ' || coalesce(municipality_name, '') || ' ' ||
          array_to_string(format_names, ' ')), 'C')
      ${scope}
    `;
  }

  /** Exécute la recherche : renvoie les identifiants d'événements classés + le total. */
  async query(filter: SearchFilter): Promise<{ ids: string[]; total: number }> {
    const hasText = Boolean(filter.text);
    const from = hasText
      ? Prisma.sql`, plainto_tsquery('french', ${filter.text}) q`
      : Prisma.empty;
    const where = this.buildWhere(filter, hasText);
    const rank = hasText ? Prisma.sql`ts_rank(d.search_vector, q)` : Prisma.sql`0`;
    const orderBy = this.buildOrderBy(this.effectiveSort(filter.sort, hasText));

    const rows = await this.prisma.$queryRaw<{ eventId: string }[]>`
      SELECT d.event_id AS "eventId", ${rank} AS rank
      FROM search_documents d ${from}
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${filter.take} OFFSET ${filter.skip}
    `;
    const totals = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM search_documents d ${from} ${where}
    `;
    return { ids: rows.map((row) => row.eventId), total: totals[0]?.count ?? 0 };
  }

  /**
   * Facettes contextuelles : répartition des résultats de la recherche courante (texte + période)
   * par référentiel indexé. Les sélections catégorielles ne restreignent pas les facettes (les
   * alternatives restent visibles pour affiner la navigation).
   */
  async facets(filter: SearchFilter): Promise<SearchFacets> {
    const hasText = Boolean(filter.text);
    const from = hasText
      ? Prisma.sql`, plainto_tsquery('french', ${filter.text}) q`
      : Prisma.empty;
    const where = this.buildContextWhere(filter, hasText);

    // Requêtes séquentielles : le driver pg n'exécute qu'une requête à la fois par connexion.
    const activities = await this.prisma.$queryRaw<SearchFacet[]>`
      SELECT d.activity_id AS id, d.activity_name AS name, count(*)::int AS count
      FROM search_documents d ${from} ${where}
      GROUP BY d.activity_id, d.activity_name
      ORDER BY count DESC, name ASC
    `;
    const categories = await this.prisma.$queryRaw<SearchFacet[]>`
      SELECT ct.id, ct.name, count(*)::int AS count FROM (
        SELECT unnest(d.category_ids) AS id, unnest(d.category_names) AS name
        FROM search_documents d ${from} ${where}
      ) ct
      GROUP BY ct.id, ct.name
      ORDER BY count DESC, name ASC
    `;
    const municipalities = await this.prisma.$queryRaw<SearchFacet[]>`
      SELECT d.municipality_id AS id, d.municipality_name AS name, count(*)::int AS count
      FROM search_documents d ${from} ${where} ${this.and(where, Prisma.sql`d.municipality_id IS NOT NULL`)}
      GROUP BY d.municipality_id, d.municipality_name
      ORDER BY count DESC, name ASC
    `;
    const tags = await this.prisma.$queryRaw<SearchFacet[]>`
      SELECT tg.id, tg.name, count(*)::int AS count FROM (
        SELECT unnest(d.tag_ids) AS id, unnest(d.tag_names) AS name
        FROM search_documents d ${from} ${where}
      ) tg
      GROUP BY tg.id, tg.name
      ORDER BY count DESC, name ASC
    `;
    return { activities, categories, municipalities, tags };
  }

  /** Recharge les événements du Catalog pour les identifiants classés (hydratation des résultats). */
  hydrate(ids: string[], userId: string): Promise<EventWithRefsAndParticipation[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.event.findMany({
      where: { id: { in: ids } },
      include: { ...EVENT_REFS_INCLUDE, participations: { where: { userId } } },
    });
  }

  /** Tri par défaut : pertinence si texte, sinon « à venir ». `relevance` sans texte retombe sur `upcoming`. */
  private effectiveSort(sort: SearchSort, hasText: boolean): SearchSort {
    if (sort === 'relevance' && !hasText) {
      return 'upcoming';
    }
    return sort;
  }

  private buildOrderBy(sort: SearchSort): Prisma.Sql {
    switch (sort) {
      case 'relevance':
        return Prisma.sql`rank DESC, d.starts_at ASC`;
      case 'newest':
        return Prisma.sql`d.published_at DESC NULLS LAST`;
      case 'title':
        return Prisma.sql`d.title ASC`;
      default:
        return Prisma.sql`d.starts_at ASC`;
    }
  }

  /** Prédicats de contexte (texte + période) — communs à la recherche et aux facettes. */
  private contextConditions(filter: SearchFilter, hasText: boolean): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [];
    if (hasText) {
      conditions.push(Prisma.sql`d.search_vector @@ q`);
    }
    if (filter.startsFrom) {
      conditions.push(Prisma.sql`d.starts_at >= ${filter.startsFrom}`);
    }
    if (filter.startsTo) {
      conditions.push(Prisma.sql`d.starts_at <= ${filter.startsTo}`);
    }
    return conditions;
  }

  private buildContextWhere(filter: SearchFilter, hasText: boolean): Prisma.Sql {
    return this.toWhere(this.contextConditions(filter, hasText));
  }

  /** Prédicats complets : contexte + sélections catégorielles indexées. */
  private buildWhere(filter: SearchFilter, hasText: boolean): Prisma.Sql {
    const conditions = this.contextConditions(filter, hasText);
    if (filter.activityId) {
      conditions.push(Prisma.sql`d.activity_id = ${filter.activityId}::uuid`);
    }
    if (filter.categoryId) {
      conditions.push(Prisma.sql`${filter.categoryId}::uuid = ANY(d.category_ids)`);
    }
    if (filter.municipalityId) {
      conditions.push(Prisma.sql`d.municipality_id = ${filter.municipalityId}::uuid`);
    }
    if (filter.tagId) {
      conditions.push(Prisma.sql`${filter.tagId}::uuid = ANY(d.tag_ids)`);
    }
    return this.toWhere(conditions);
  }

  private toWhere(conditions: Prisma.Sql[]): Prisma.Sql {
    return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
  }

  /** Ajoute une condition supplémentaire à une clause WHERE existante (ou en crée une). */
  private and(existing: Prisma.Sql, extra: Prisma.Sql): Prisma.Sql {
    return existing === Prisma.empty ? Prisma.sql`WHERE ${extra}` : Prisma.sql`AND ${extra}`;
  }
}
