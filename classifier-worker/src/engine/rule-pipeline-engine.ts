import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  ClassificationContext,
  ClassificationRule,
} from '../classification-rule.interface';

export const CLASSIFICATION_RULES = 'CLASSIFICATION_RULES';

/**
 * Moteur de règles (ADR.06). Il orchestre uniquement l'exécution ordonnée d'une collection
 * de règles indépendantes ; il ne connaît aucune règle concrète. Une règle en échec
 * n'interrompt pas les autres (diagnostic).
 */
@Injectable()
export class RulePipelineEngine {
  private readonly logger = new Logger(RulePipelineEngine.name);

  constructor(@Inject(CLASSIFICATION_RULES) private readonly rules: ClassificationRule[]) {}

  async run(context: ClassificationContext): Promise<void> {
    for (const rule of this.rules) {
      try {
        await rule.execute(context);
      } catch (error) {
        this.logger.warn(`Règle ${rule.name} en échec : ${(error as Error).message}`);
        context.diagnostics.push({
          rule: rule.name,
          level: 'ERROR',
          message: (error as Error).message,
        });
      }
    }
  }
}
