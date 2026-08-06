import { BadRequestException, Injectable } from '@nestjs/common';
import { CaseStatus, type Case } from '@prisma/client';
import { ActivitiesService } from '../reference-data/activities/activities.service';
import { EventTypesService } from '../reference-data/event-types/event-types.service';
import { OrganizersService } from '../reference-data/organizers/organizers.service';
import { SubjectsService } from '../reference-data/subjects/subjects.service';
import { VenuesService } from '../reference-data/venues/venues.service';
import { CasesService } from './cases.service';
import {
  REFERENCE_KIND_LABELS,
  REFERENCE_PARENT_OF,
  suggestionSubject,
  type ReferenceKind,
  type ReferenceSuggestion,
  type ReferenceSuggestionMetadata,
} from './reference-suggestion';

/** Décision de la modération : la proposition telle qu'elle sera créée (libellé corrigeable). */
export interface AcceptSuggestionInput {
  kind: ReferenceKind;
  name: string;
  /** Domain (Activité) ou Family (Sujet). Obligatoire pour ces deux référentiels. */
  parentId?: string;
  /** Motif de la décision, joint à l'historique de la Case. */
  comment?: string;
}

/**
 * Propositions d'ajout au référentiel (Case `REFERENCE_SUGGESTION`).
 *
 * Deux temps distincts, et c'est tout l'intérêt du dispositif : **proposer** est ouvert à tout
 * utilisateur authentifié — cela n'écrit rien au référentiel — tandis que **créer** reste réservé à
 * la modération, qui peut corriger le libellé avant de valider. La gouvernance du référentiel est
 * préservée sans faire perdre au proposant le libellé qu'il avait sous les yeux.
 */
@Injectable()
export class ReferenceSuggestionService {
  constructor(
    private readonly cases: CasesService,
    private readonly activities: ActivitiesService,
    private readonly eventTypes: EventTypesService,
    private readonly subjects: SubjectsService,
    private readonly organizers: OrganizersService,
    private readonly venues: VenuesService,
  ) {}

  /** Ouvre la proposition. Aucune écriture au référentiel : seule une Case est créée. */
  async open(input: {
    suggestion: ReferenceSuggestion;
    requesterId: string;
    origin: string;
    eventId?: string | null;
    organizationId?: string | null;
  }): Promise<Case> {
    const label = input.suggestion.label.trim();
    if (!label) {
      throw new BadRequestException('Le libellé proposé est obligatoire.');
    }
    const suggestion: ReferenceSuggestion = { ...input.suggestion, label };
    const metadata: ReferenceSuggestionMetadata = { suggestion };
    return this.cases.open({
      type: 'REFERENCE_SUGGESTION',
      subject: suggestionSubject(suggestion.kind, label),
      description: this.describe(suggestion),
      origin: input.origin as never,
      requesterId: input.requesterId,
      eventId: input.eventId ?? null,
      organizationId: input.organizationId ?? null,
      metadata: metadata as never,
    });
  }

  /**
   * Accepte la proposition : crée l'entrée du référentiel puis **résout** la Case.
   *
   * L'ordre importe. La création d'abord : si le référentiel refuse (doublon, parent inconnu,
   * terme interdit), la Case reste ouverte et la modération corrige — plutôt qu'une Case résolue
   * sans référence créée.
   */
  async accept(caseId: string, input: AcceptSuggestionInput, operatorId: string): Promise<Case> {
    const name = input.name.trim();
    if (!name) {
      throw new BadRequestException('Le libellé à créer est obligatoire.');
    }
    const parentKind = REFERENCE_PARENT_OF[input.kind];
    if (parentKind && !input.parentId) {
      throw new BadRequestException(
        parentKind === 'DOMAIN'
          ? 'Un domaine de rattachement est obligatoire pour créer une activité.'
          : 'Une famille de rattachement est obligatoire pour créer un sujet.',
      );
    }

    const createdId = await this.create(input.kind, name, input.parentId);

    const comment =
      input.comment?.trim() ||
      `${REFERENCE_KIND_LABELS[input.kind]} « ${name} » ajoutée au référentiel.`;
    await this.cases.addComment(caseId, operatorId, comment, false);
    await this.cases.mergeMetadata(caseId, { createdReferenceId: createdId });
    return this.cases.changeStatus(caseId, CaseStatus.RESOLVED, operatorId, comment);
  }

  private async create(kind: ReferenceKind, name: string, parentId?: string): Promise<string> {
    switch (kind) {
      case 'ACTIVITY':
        return (await this.activities.create({ name, domainId: parentId as string })).id;
      case 'EVENT_TYPE':
        return (await this.eventTypes.create({ name })).id;
      case 'SUBJECT':
        return (await this.subjects.create({ name, familyId: parentId as string })).id;
      case 'ORGANIZER':
        return (await this.organizers.create({ name })).id;
      case 'VENUE':
        return (await this.venues.create({ name })).id;
    }
  }

  private describe(suggestion: ReferenceSuggestion): string {
    const lines = [
      `Référentiel : ${REFERENCE_KIND_LABELS[suggestion.kind]}`,
      `Libellé proposé : « ${suggestion.label} »`,
    ];
    if (suggestion.context) {
      lines.push(`Constaté sur : ${suggestion.context}`);
    }
    lines.push(
      'Proposition issue de la qualification d’un événement : le libellé a été extrait du document ' +
        'mais ne correspond à aucune entrée du référentiel.',
    );
    return lines.join('\n');
  }
}
