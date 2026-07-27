import { Module } from '@nestjs/common';
import { ProvisionalCurationController } from './provisioning/provisional-curation.controller';
import { ProvisionalCurationRepository } from './provisioning/provisional-curation.repository';
import { ProvisionalCurationService } from './provisioning/provisional-curation.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { ActivityRepository } from './activities/activity.repository';
import { AliasRepository } from './aliases/alias.repository';
import { AliasesController } from './aliases/aliases.controller';
import { AliasesService } from './aliases/aliases.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { CategoryRepository } from './categories/category.repository';
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';
import { CountryRepository } from './countries/country.repository';
import { DomainRepository } from './domains/domain.repository';
import { DomainsController } from './domains/domains.controller';
import { DomainsService } from './domains/domains.service';
import { EventFormatRepository } from './event-formats/event-format.repository';
import { EventFormatsController } from './event-formats/event-formats.controller';
import { EventFormatsService } from './event-formats/event-formats.service';
import { EventTypeRepository } from './event-types/event-type.repository';
import { EventTypesController } from './event-types/event-types.controller';
import { EventTypesService } from './event-types/event-types.service';
import { MunicipalitiesController } from './municipalities/municipalities.controller';
import { MunicipalitiesService } from './municipalities/municipalities.service';
import { MunicipalityRepository } from './municipalities/municipality.repository';
import { OrganizerRepository } from './organizers/organizer.repository';
import { OrganizersController } from './organizers/organizers.controller';
import { OrganizersService } from './organizers/organizers.service';
import { RegionRepository } from './regions/region.repository';
import { RegionsController } from './regions/regions.controller';
import { RegionsService } from './regions/regions.service';
import { TagRepository } from './tags/tag.repository';
import { TagsController } from './tags/tags.controller';
import { TagsService } from './tags/tags.service';
import { VenueRepository } from './venues/venue.repository';
import { VenuesController } from './venues/venues.controller';
import { VenuesService } from './venues/venues.service';
import { GeoImportController } from './geo-import/geo-import.controller';
import { GeoImportRepository } from './geo-import/geo-import.repository';
import { GeoImportService } from './geo-import/geo-import.service';

/**
 * Administration des référentiels métier (TSPEC.08) : Domain, Activity (+ Alias), EventType,
 * EventFormat, Organizer, Venue, et les référentiels géographiques Country → Region →
 * Municipality. Lecture ouverte aux utilisateurs authentifiés ; écritures réservées à la
 * permission `reference.manage` (ADR.08).
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
    CountriesController,
    RegionsController,
    MunicipalitiesController,
    CategoriesController,
    TagsController,
    ProvisionalCurationController,
    GeoImportController,
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
    CountryRepository,
    CountriesService,
    RegionRepository,
    RegionsService,
    MunicipalityRepository,
    MunicipalitiesService,
    CategoryRepository,
    CategoriesService,
    TagRepository,
    TagsService,
    ProvisionalCurationRepository,
    ProvisionalCurationService,
    GeoImportRepository,
    GeoImportService,
  ],
  exports: [
    DomainRepository,
    ActivityRepository,
    EventTypeRepository,
    EventFormatRepository,
    OrganizerRepository,
    VenueRepository,
    AliasRepository,
    CountryRepository,
    RegionRepository,
    MunicipalityRepository,
    CategoryRepository,
    TagRepository,
  ],
})
export class ReferenceDataModule {}
