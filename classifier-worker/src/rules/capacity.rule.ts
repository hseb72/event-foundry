import { Injectable } from '@nestjs/common';
import type { ClassificationContext, ClassificationRule } from '../classification-rule.interface';

/**
 * Détection d'une capacité (« 32 places »). La capacité n'est pas un champ d'Event en V1
 * (ARCHI.03) : la règle produit uniquement un diagnostic informatif pour la revue.
 */
@Injectable()
export class CapacityRule implements ClassificationRule {
  readonly name = 'CapacityRule';

  async execute(context: ClassificationContext): Promise<void> {
    const match = context.normalizedText.match(/(\d{1,4})\s*places/);
    if (match) {
      context.diagnostics.push({
        rule: this.name,
        level: 'INFO',
        message: `Capacité détectée : ${match[1]} places.`,
      });
    }
  }
}
