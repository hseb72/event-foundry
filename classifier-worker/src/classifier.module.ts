import { Module } from '@nestjs/common';
import { ClassifierProcessor } from './classifier.processor';
import type { ClassificationRule } from './classification-rule.interface';
import { CLASSIFICATION_RULES, RulePipelineEngine } from './engine/rule-pipeline-engine';
import { ResultPublisher } from './publisher/result-publisher';
import { HttpReferenceDataProvider } from './reference/http-reference-data-provider';
import { REFERENCE_DATA_PROVIDER } from './reference/reference-data-provider.interface';
import { ActivityFromSubjectRule } from './rules/activity-from-subject.rule';
import { ActivityRule } from './rules/activity.rule';
import { CapacityRule } from './rules/capacity.rule';
import { DateRule } from './rules/date.rule';
import { EventTypeRule } from './rules/event-type.rule';
import { ModalityRule } from './rules/modality.rule';
import { OrganizerRule } from './rules/organizer.rule';
import { SubjectRule } from './rules/subject.rule';
import { PriceRule } from './rules/price.rule';
import { TimeRule } from './rules/time.rule';
import { TitleRule } from './rules/title.rule';
import { UrlRule } from './rules/url.rule';
import { VenueRule } from './rules/venue.rule';
import { ClassifierWorker } from './worker';

// Ordre d'exécution des règles (réordonnable sans modifier le moteur — ADR.06).
const RULE_CLASSES = [
  TitleRule,
  DateRule,
  TimeRule,
  ActivityRule,
  EventTypeRule,
  SubjectRule,
  // Après SubjectRule : ne complète l'activité que si elle n'a pas été reconnue littéralement.
  ActivityFromSubjectRule,
  ModalityRule,
  OrganizerRule,
  VenueRule,
  PriceRule,
  UrlRule,
  CapacityRule,
];

@Module({
  providers: [
    { provide: REFERENCE_DATA_PROVIDER, useClass: HttpReferenceDataProvider },
    ...RULE_CLASSES,
    {
      provide: CLASSIFICATION_RULES,
      inject: RULE_CLASSES,
      useFactory: (...rules: ClassificationRule[]): ClassificationRule[] => rules,
    },
    RulePipelineEngine,
    ClassifierProcessor,
    ResultPublisher,
    ClassifierWorker,
  ],
})
export class ClassifierModule {}
