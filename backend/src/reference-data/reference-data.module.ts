import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { ActivityRepository } from './activities/activity.repository';
import { AliasRepository } from './aliases/alias.repository';
import { AliasesController } from './aliases/aliases.controller';
import { AliasesService } from './aliases/aliases.service';
import { DomainRepository } from './domains/domain.repository';
import { DomainsController } from './domains/domains.controller';
import { DomainsService } from './domains/domains.service';
import { EventFormatRepository } from './event-formats/event-format.repository';
import { EventFormatsController } from './event-formats/event-formats.controller';
import { EventFormatsService } from './event-formats/event-formats.service';
import { EventTypeRepository } from './event-types/event-type.repository';
import { EventTypesController } from './event-types/event-types.controller';
import { EventTypesService } from './event-types/event-types.service';
import { OrganizerRepository } from './organizers/organizer.repository';
import { OrganizersController } from './organizers/organizers.controller';
import { OrganizersService } from './organizers/organizers.service';
import { VenueRepository } from './venues/venue.repository';
import { VenuesController } from './venues/venues.controller';
import { VenuesService } from './venues/venues.service';

/**
 * Administration des référentiels métier (FSPEC.07) : Domain, Activity (+ Alias),
 * EventType, EventFormat, Organizer, Venue. Lecture ouverte aux utilisateurs
 * authentifiés ; écritures réservées au rôle ADMIN.
 */
@Module({
  controllers: [
    DomainsController,
    ActivitiesController,
    EventTypesController,
    EventFormatsController,
    OrganizersController,
    VenuesController,
    AliasesController,
  ],
  providers: [
    DomainRepository,
    DomainsService,
    ActivityRepository,
    ActivitiesService,
    EventTypeRepository,
    EventTypesService,
    EventFormatRepository,
    EventFormatsService,
    OrganizerRepository,
    OrganizersService,
    VenueRepository,
    VenuesService,
    AliasRepository,
    AliasesService,
  ],
  exports: [
    DomainRepository,
    ActivityRepository,
    EventTypeRepository,
    EventFormatRepository,
    OrganizerRepository,
    VenueRepository,
    AliasRepository,
  ],
})
export class ReferenceDataModule {}
