import { Injectable, NotFoundException } from '@nestjs/common';
import type { Alias } from '@prisma/client';
import { AliasNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { ALIAS_TARGET_LABELS, type AliasTarget } from './alias-target';
import { CreateAliasDto, UpdateAliasDto } from './alias.dto';
import { AliasRepository } from './alias.repository';

/**
 * Alias de référentiel (DATA.01 v2.0) : libellés alternatifs reconnus par le moteur d'analyse.
 * Portent sur **l'un des cinq** référentiels — Activity, EventType, Subject, Organizer, Venue —
 * puisque ce qu'une affiche abrège est le plus souvent un sujet (« MTG ») ou un type.
 */
@Injectable()
export class AliasesService {
  constructor(private readonly repository: AliasRepository) {}

  async listByTarget(
    target: AliasTarget,
    targetId: string,
    includeInactive: boolean,
  ): Promise<Alias[]> {
    await this.assertTargetExists(target, targetId);
    return this.repository.listByTarget(target, targetId, includeInactive);
  }

  /** Instantané complet des alias actifs : une seule requête pour tout le moteur d'analyse. */
  listAllActive(): Promise<Alias[]> {
    return this.repository.listAllActive();
  }

  async getOrThrow(id: string): Promise<Alias> {
    const alias = await this.repository.findById(id);
    if (!alias) {
      throw new AliasNotFoundException(id);
    }
    return alias;
  }

  async create(target: AliasTarget, targetId: string, dto: CreateAliasDto): Promise<Alias> {
    return this.createFor(target, targetId, dto.value);
  }

  /**
   * Rattache un libellé à une entrée existante. L'unicité globale de `value` est voulue : un même
   * libellé ne peut pas désigner deux références, sans quoi la reconnaissance serait ambiguë.
   */
  async createFor(target: AliasTarget, targetId: string, value: string): Promise<Alias> {
    await this.assertTargetExists(target, targetId);
    try {
      return await this.repository.createForTarget(target, targetId, value);
    } catch (error) {
      rethrowAsConflict(error, `L'alias « ${value} » est déjà utilisé.`);
    }
  }

  async update(id: string, dto: UpdateAliasDto): Promise<Alias> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `L'alias « ${dto.value} » est déjà utilisé.`);
    }
  }

  async deactivate(id: string): Promise<Alias> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }

  /** L'entrée visée doit exister : un alias orphelin serait irrécupérable côté moteur. */
  private async assertTargetExists(target: AliasTarget, targetId: string): Promise<void> {
    if (!(await this.repository.targetExists(target, targetId))) {
      throw new NotFoundException(`${ALIAS_TARGET_LABELS[target]} ${targetId} introuvable.`);
    }
  }
}
