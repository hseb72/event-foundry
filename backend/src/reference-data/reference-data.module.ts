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
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';
import { CountryRepository } from './countries/country.repository';
import { DomainRepository } from './domains/domain.repository';
import { DomainsController } from './domains/domains.controller';
import { DomainsService } from './domains/domains.service';
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
import { ActivityFamilyRepository } from './families/activity-family.repository';
import { FamiliesController } from './families/families.controller';
import { FamiliesService } from './families/families.service';
import { SubjectRepository } from './subjects/subject.repository';
import { SubjectsController } from './subjects/subjects.controller';
import { SubjectsService } from './subjects/subjects.service';
import { ModalityRepository } from './modalities/modality.repository';
import { ModalitiesController } from './modalities/modalities.controller';
import { ModalitiesService } from './modalities/modalities.service';
import { ModalityDimensionRepository } from './modality-dimensions/modality-dimension.repository';
import { ModalityDimensionsController } from './modality-dimensions/modality-dimensions.controller';
import { ModalityDimensionsService } from './modality-dimensions/modality-dimensions.service';

/**
 * Administration des référentiels métier (TSPEC.08) : Domain, Activity (+ Alias, Family, Subject),
 * EventType (transverse), ModalityDimension/Modality, Organizer, Venue, Tag, et les référentiels
 * géographiques Country → Region → Municipality. Lecture ouverte aux utilisateurs authentifiés ;
 * écritures réservées à la permission `reference.manage` (ADR.08).
 */
@Module({
  controllers: [
    DomainsController,
    ActivitiesController,
    EventTypesController,
    OrganizersController,
    VenuesController,
    AliasesController,
    CountriesController,
    RegionsController,
    MunicipalitiesController,
    TagsController,
    FamiliesController,
    SubjectsController,
    ModalityDimensionsController,
    ModalitiesController,
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
    TagRepository,
    TagsService,
    ActivityFamilyRepository,
    FamiliesService,
    SubjectRepository,
    SubjectsService,
    ModalityRepository,
    ModalitiesService,
    ModalityDimensionRepository,
    ModalityDimensionsService,
    ProvisionalCurationRepository,
    ProvisionalCurationService,
    GeoImportRepository,
    GeoImportService,
  ],
  exports: [
    // Services exposés pour l'acceptation d'une proposition d'ajout (Case REFERENCE_SUGGESTION) :
    // la création passe par le domaine propriétaire du référentiel, avec ses contrôles.
    ActivitiesService,
    EventTypesService,
    SubjectsService,
    OrganizersService,
    VenuesService,
    DomainRepository,
    ActivityRepository,
    EventTypeRepository,
    OrganizerRepository,
    VenueRepository,
    AliasRepository,
    CountryRepository,
    RegionRepository,
    MunicipalityRepository,
    TagRepository,
    ActivityFamilyRepository,
    SubjectRepository,
    ModalityRepository,
    ModalityDimensionRepository,
  ],
})
export class ReferenceDataModule {}
