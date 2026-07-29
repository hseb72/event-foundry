import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReferenceDataApi } from '../core/api/reference-data.service';
import { IdentityService } from '../core/api/identity.service';
import {
  ActivityDto,
  CreateEventInput,
  EventDraft,
  EventEditValue,
  ModalityDimensionDto,
  MunicipalityGeo,
  OrganizationAddress,
  ReferentialItem,
} from '../core/models';

/**
 * Formulaire d'Event réutilisé par la création manuelle et la validation d'un candidat.
 * Le Domain n'est jamais saisi : il est déduit de l'Activity côté Backend (règle d'or 3).
 * Les listes EventType / EventFormat dépendent de l'Activity sélectionnée.
 */
@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      form {
        display: grid;
        gap: 0.9rem;
        max-width: 640px;
      }
      .row {
        display: grid;
        gap: 0.9rem;
        grid-template-columns: 1fr 1fr;
      }
      label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.3rem;
      }
      .req::after {
        content: ' *';
        color: var(--red, #c0392b);
      }
      .error {
        color: var(--red, #c0392b);
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 0.4rem;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .tag-chip {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.82rem;
        cursor: pointer;
      }
      .tag-chip.on {
        background: var(--exp);
        border-color: var(--exp);
        color: #fff;
      }
      /* En-tête d'une section repliable (mêmes codes que la box « Nouvelle soumission »). */
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
      }
      .section-head label {
        margin-bottom: 0;
      }
      .count {
        display: inline-block;
        margin-left: 0.35rem;
        padding: 0.05rem 0.45rem;
        border-radius: 999px;
        background: var(--exp);
        color: var(--exp-contrast, #fff);
        font-size: 0.72rem;
        font-weight: 700;
      }
      .propose {
        margin-top: 0.4rem;
        padding: 0.5rem 0.6rem;
        border: 1px dashed var(--orange, #d97706);
        border-radius: 8px;
        background: color-mix(in srgb, var(--orange, #d97706) 8%, transparent);
        font-size: 0.82rem;
        display: grid;
        gap: 0.4rem;
      }
      .propose-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        align-items: center;
      }
      .propose .select,
      .propose .btn {
        font-size: 0.82rem;
        padding: 0.3rem 0.55rem;
      }
      @media (max-width: 560px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <form (ngSubmit)="submit()">
      <div>
        <label class="req">Titre</label>
        <input class="input" [(ngModel)]="model.title" name="title" required maxlength="200" />
      </div>

      <div>
        <label>Description</label>
        <textarea class="input" [(ngModel)]="model.description" name="description" rows="3"></textarea>
      </div>

      <div class="row">
        <div>
          <label class="req">Activité</label>
          <select class="select" [(ngModel)]="model.activityId" name="activityId"
                  (ngModelChange)="onActivityChange()" required>
            <option value="">— choisir —</option>
            @for (a of activities; track a.id) {
              <option [value]="a.id">{{ a.name }}</option>
            }
          </select>
          @if (unresolved.activity) {
            <div class="propose">
              <span>Activité « <strong>{{ unresolved.activity }}</strong> » non reconnue.</span>
              @if (canManageRef) {
                <div class="propose-actions">
                  @if (domains.length > 1) {
                    <select class="select" [(ngModel)]="newActivityDomainId" name="newActivityDomainId">
                      <option value="">Domaine…</option>
                      @for (d of domains; track d.id) { <option [value]="d.id">{{ d.name }}</option> }
                    </select>
                  }
                  <button type="button" class="btn" [disabled]="!newActivityDomainId || busy"
                          (click)="createActivityRef()">Créer l'activité</button>
                  <select class="select" [(ngModel)]="associateActivityId" name="associateActivityId"
                          (ngModelChange)="associateActivityRef()">
                    <option value="">Associer à une existante…</option>
                    @for (a of activities; track a.id) { <option [value]="a.id">{{ a.name }}</option> }
                  </select>
                </div>
              } @else {
                <span class="muted">Demandez à un administrateur de l'ajouter au référentiel.</span>
              }
            </div>
          }
        </div>
        <div>
          <label>Type d'événement <span class="muted">(nature du rassemblement)</span></label>
          <select class="select" [(ngModel)]="model.eventTypeId" name="eventTypeId">
            <option value="">— aucun —</option>
            @for (t of eventTypes; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
          @if (unresolved.eventType) {
            <div class="propose">
              <span>Type « <strong>{{ unresolved.eventType }}</strong> » non reconnu.</span>
              @if (canManageRef) {
                <div class="propose-actions">
                  <button type="button" class="btn" [disabled]="busy" (click)="createEventTypeRef()">
                    Créer ce type
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="row">
        <div>
          <label>Organisateur</label>
          <select class="select" [(ngModel)]="model.organizerId" name="organizerId">
            <option value="">— aucun —</option>
            @for (o of organizers; track o.id) {
              <option [value]="o.id">{{ o.name }}</option>
            }
          </select>
          @if (unresolved.organizer) {
            <div class="propose">
              <span>Organisateur « <strong>{{ unresolved.organizer }}</strong> » non reconnu.</span>
              @if (canManageRef) {
                <div class="propose-actions">
                  <button type="button" class="btn" [disabled]="busy" (click)="createOrganizerRef()">
                    Créer cet organisateur
                  </button>
                </div>
              }
            </div>
          }
        </div>
        <div>
          <label>Lieu</label>
          <select class="select" [(ngModel)]="model.venueId" name="venueId">
            <option value="">— aucun —</option>
            @for (v of venues; track v.id) {
              <option [value]="v.id">{{ v.name }}</option>
            }
          </select>
          @if (unresolved.venue) {
            <div class="propose">
              <span>Lieu « <strong>{{ unresolved.venue }}</strong> » non reconnu.</span>
              @if (canManageRef) {
                <div class="propose-actions">
                  <button type="button" class="btn" [disabled]="busy" (click)="createVenueRef()">
                    Créer ce lieu
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>

      @if (model.activityId && subjects.length) {
        <div>
          <label>Sujets <span class="muted">(le jeu / le genre / la discipline — plusieurs possibles)</span></label>
          <select class="select" multiple [(ngModel)]="model.subjectIds" name="subjectIds">
            @for (s of subjects; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>
      }

      <!-- Modalités : facultatives et volumineuses (plusieurs dimensions) → section repliable,
           repliée par défaut. Le compteur reste visible pour ne pas masquer une sélection. -->
      @if (modalityDimensions.length) {
        <div>
          <div class="section-head">
            <label>
              Modalités <span class="muted">(par dimension, facultatif)</span>
              @if (model.modalityIds.length) {
                <span class="count">{{ model.modalityIds.length }}</span>
              }
            </label>
            <button type="button" class="btn btn-sm" (click)="modalitiesOpen = !modalitiesOpen"
                    [attr.aria-expanded]="modalitiesOpen">
              {{ modalitiesOpen ? '▲ Réduire' : '▼ Étendre' }}
            </button>
          </div>
          @if (modalitiesOpen) {
            <div style="margin-top:0.5rem">
              @for (dim of modalityDimensions; track dim.id) {
                @if (dim.modalities.length) {
                  <div style="margin-bottom:0.4rem">
                    <span class="muted" style="font-size:0.78rem">{{ dim.name }}</span>
                    <div class="tags">
                      @for (m of dim.modalities; track m.id) {
                        <button type="button" class="tag-chip" [class.on]="model.modalityIds.includes(m.id)"
                                (click)="toggleModality(m.id)">
                          {{ m.name }}
                        </button>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      }

      @if (orgAddresses.length) {
        <div>
          <label>Adresses de l'organisation</label>
          <div class="tags">
            @for (a of orgAddresses; track a.id) {
              <button type="button" class="tag-chip" (click)="useOrgAddress(a)">
                📍 {{ a.label }}@if (a.municipalityName) { — {{ a.municipalityName }} }
              </button>
            }
          </div>
        </div>
      }

      <div>
        <label>Localisation (pays + code postal)</label>
        <div class="row" style="grid-template-columns:1fr 1fr">
          <select class="select" [(ngModel)]="model.countryId" name="countryId"
                  (ngModelChange)="onCountryChange()">
            <option value="">Pays…</option>
            @for (c of countries; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
          <div style="display:flex;gap:0.4rem">
            <input class="input" [(ngModel)]="postalCode" name="postalCode" placeholder="Code postal"
                   [disabled]="!model.countryId" (keyup.enter)="searchPostal()" />
            <button type="button" class="btn" [disabled]="!model.countryId || !postalCode.trim()"
                    (click)="searchPostal()">Rechercher</button>
          </div>
        </div>
        @if (resolvedMunicipalities.length) {
          <div class="row" style="grid-template-columns:1fr 1fr;margin-top:0.5rem">
            <select class="select" [(ngModel)]="model.municipalityId" name="municipalityId"
                    (ngModelChange)="onMunicipalitySelect()">
              <option value="">Commune…</option>
              @for (m of resolvedMunicipalities; track m.id) {
                <option [value]="m.id">{{ m.name }}</option>
              }
            </select>
            <div style="align-self:center;font-size:0.85rem" class="muted">
              Région : <strong style="color:var(--text)">{{ selectedRegionName || '—' }}</strong> (dérivée)
            </div>
          </div>
        } @else if (postalSearched) {
          <p class="muted" style="font-size:0.8rem;margin-top:0.35rem">
            Aucune commune trouvée pour ce code postal dans ce pays.
          </p>
        }
      </div>

      @if (tags.length) {
        <div>
          <label>Tags</label>
          <div class="tags">
            @for (t of tags; track t.id) {
              <button type="button" class="tag-chip" [class.on]="model.tagIds.includes(t.id)"
                      (click)="toggleTag(t.id)">
                {{ t.name }}
              </button>
            }
          </div>
        </div>
      }

      <div class="row">
        <div>
          <label class="req">Début</label>
          <input class="input" type="datetime-local" [(ngModel)]="model.startsAt" name="startsAt" required />
        </div>
        <div>
          <label>Fin</label>
          <input class="input" type="datetime-local" [(ngModel)]="model.endsAt" name="endsAt" />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Prix</label>
          <input class="input" type="number" min="0" step="0.01" [(ngModel)]="model.price" name="price" />
        </div>
        <div>
          <label>Devise</label>
          <input class="input" maxlength="3" placeholder="EUR" [(ngModel)]="model.currency" name="currency" />
        </div>
      </div>

      @if (refError) {
        <p class="error">{{ refError }}</p>
      }
      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <div class="actions">
        <button type="submit" class="btn btn-primary" [disabled]="busy">{{ submitLabel }}</button>
        @if (showReject) {
          <button type="button" class="btn" [disabled]="busy" (click)="reject.emit()">Rejeter</button>
        }
      </div>
    </form>
  `,
})
export class EventFormComponent implements OnInit {
  @Input() submitLabel = 'Enregistrer';
  @Input() showReject = false;
  @Input() busy = false;
  /** Valeurs détectées (noms) pour préremplir le formulaire après chargement des référentiels. */
  @Input() draft: EventDraft | null = null;
  /** Valeurs existantes (identifiants) pour préremplir le formulaire en édition/correction. */
  @Input() initial: EventEditValue | null = null;

  @Output() save = new EventEmitter<CreateEventInput>();
  @Output() reject = new EventEmitter<void>();

  activities: ActivityDto[] = [];
  eventTypes: ReferentialItem[] = [];
  organizers: ReferentialItem[] = [];
  venues: ReferentialItem[] = [];
  tags: ReferentialItem[] = [];
  // DATA.01 v2.0 — Axe A (sujets, dépendent de l'activité) + Axe C (modalités groupées par dimension).
  subjects: ReferentialItem[] = [];
  modalityDimensions: ModalityDimensionDto[] = [];
  /** Section « Modalités » dépliée ? Repliée par défaut : facultative et volumineuse. */
  modalitiesOpen = false;
  countries: ReferentialItem[] = [];
  // Localisation V3 (chantier §8.1) : sélection par pays + code postal, région dérivée.
  postalCode = '';
  postalSearched = false;
  resolvedMunicipalities: MunicipalityGeo[] = [];
  selectedRegionName = '';

  error = '';

  // Levier 1 : libellés extraits mais absents des référentiels (présents-mais-non-résolus).
  unresolved: {
    activity?: string;
    eventType?: string;
    organizer?: string;
    venue?: string;
  } = {};
  // Levier 2 : création / association à la volée (nécessite reference.manage).
  domains: ReferentialItem[] = [];
  canManageRef = false;
  newActivityDomainId = '';
  associateActivityId = '';
  refError = '';

  model = {
    title: '',
    description: '',
    activityId: '',
    eventTypeId: '',
    organizerId: '',
    venueId: '',
    countryId: '',
    municipalityId: '',
    tagIds: [] as string[],
    subjectIds: [] as string[],
    modalityIds: [] as string[],
    startsAt: '',
    endsAt: '',
    price: null as number | null,
    currency: '',
  };

  // Adresses de l'organisation active proposées comme localisation (chantier §8.2 / RG-LOC-05).
  orgAddresses: OrganizationAddress[] = [];

  constructor(
    private readonly referenceData: ReferenceDataApi,
    private readonly identity: IdentityService,
  ) {}

  ngOnInit(): void {
    const me = this.identity.me();
    this.canManageRef = !!me?.permissions.includes('reference.manage');
    if (this.canManageRef) {
      this.referenceData.domains().subscribe((items) => {
        this.domains = items;
        if (items.length === 1) {
          this.newActivityDomainId = items[0].id;
        }
      });
    }
    if (me?.activeOrganizationId && me.permissions.includes('organization.manage')) {
      this.identity
        .listOrganizationAddresses(me.activeOrganizationId)
        .subscribe((addresses) => (this.orgAddresses = addresses));
    }
    this.referenceData.organizers().subscribe((items) => {
      this.organizers = items;
      this.applyDraftOrganizer();
    });
    this.referenceData.venues().subscribe((items) => {
      this.venues = items;
      this.applyDraftVenue();
    });
    // Types : référentiel **transverse** (DATA.01 v2.0), chargé une fois, indépendant de l'activité.
    this.referenceData.eventTypes().subscribe((items) => {
      this.eventTypes = items;
      this.applyDraftEventType();
    });
    this.referenceData.tags().subscribe((items) => (this.tags = items));
    // Modalités (Axe C) : référentiel transverse, chargé une fois, groupé par dimension.
    this.referenceData.modalityDimensions().subscribe((items) => {
      this.modalityDimensions = items;
      this.applyDraftModalities();
    });
    this.referenceData.countries().subscribe((items) => (this.countries = items));
    this.referenceData.activities().subscribe((items) => {
      this.activities = items;
      this.applyDraftScalars();
      this.applyDraftActivity();
    });
    this.applyInitial();
  }

  /**
   * Préremplit le formulaire à partir de valeurs existantes (édition). Les listes dépendantes
   * (types / formats selon l'activité, régions / communes selon le pays) sont chargées puis la
   * sélection est posée, sans passer par les gestionnaires de changement (qui réinitialisent).
   */
  private applyInitial(): void {
    const value = this.initial;
    if (!value) {
      return;
    }
    this.model.title = value.title;
    this.model.description = value.description ?? '';
    this.model.activityId = value.activityId;
    this.model.organizerId = value.organizerId ?? '';
    this.model.venueId = value.venueId ?? '';
    this.model.tagIds = [...value.tagIds];
    this.model.modalityIds = [...(value.modalityIds ?? [])];
    this.model.startsAt = toLocalInput(value.startsAt);
    this.model.endsAt = value.endsAt ? toLocalInput(value.endsAt) : '';
    this.model.price = value.price;
    this.model.currency = value.currency ?? '';

    // Type transverse (DATA.01 v2.0) : la liste est chargée globalement (ngOnInit) ; on pose la valeur.
    this.model.eventTypeId = value.eventTypeId ?? '';
    if (value.activityId) {
      this.referenceData.subjects(value.activityId).subscribe((items) => {
        this.subjects = items;
        this.model.subjectIds = [...(value.subjectIds ?? [])];
      });
    }
    // Préremplissage de la localisation (édition) : la commune connue → pays + code postal +
    // région dérivée, via la vue géographique (chantier §8.1). La cascade n'est plus utilisée.
    if (value.municipalityId) {
      this.referenceData.municipalityGeo(value.municipalityId).subscribe((geo) => {
        this.model.countryId = geo.countryId;
        this.postalCode = geo.postalCode ?? '';
        this.resolvedMunicipalities = [geo];
        this.model.municipalityId = geo.id;
        this.selectedRegionName = geo.regionName;
      });
    } else if (value.countryId) {
      this.model.countryId = value.countryId;
    }
  }

  onCountryChange(): void {
    // Changer de pays réinitialise la recherche de commune.
    this.postalCode = '';
    this.postalSearched = false;
    this.resolvedMunicipalities = [];
    this.selectedRegionName = '';
    this.model.municipalityId = '';
  }

  /** Résout « pays + code postal → commune(s) » ; sélection automatique si une seule commune. */
  searchPostal(): void {
    const postalCode = this.postalCode.trim();
    if (!this.model.countryId || !postalCode) {
      return;
    }
    this.referenceData.resolveMunicipalities(this.model.countryId, postalCode).subscribe((communes) => {
      this.resolvedMunicipalities = communes;
      this.postalSearched = true;
      if (communes.length === 1) {
        this.model.municipalityId = communes[0].id;
        this.selectedRegionName = communes[0].regionName;
      } else {
        this.model.municipalityId = '';
        this.selectedRegionName = '';
      }
    });
  }

  /** La région est dérivée de la commune choisie (jamais saisie — RG-LOC-02). */
  onMunicipalitySelect(): void {
    const chosen = this.resolvedMunicipalities.find((m) => m.id === this.model.municipalityId);
    this.selectedRegionName = chosen ? chosen.regionName : '';
  }

  /** Préremplit la localisation depuis une adresse de l'organisation (chantier §8.2 / RG-LOC-05). */
  useOrgAddress(address: OrganizationAddress): void {
    this.model.countryId = address.countryId;
    this.postalCode = address.postalCode;
    this.postalSearched = true;
    if (address.municipalityId) {
      this.resolvedMunicipalities = [
        {
          id: address.municipalityId,
          name: address.municipalityName ?? '',
          postalCode: address.postalCode,
          regionId: '',
          regionName: address.regionName ?? '',
          countryId: address.countryId,
          countryName: address.countryName,
        },
      ];
      this.model.municipalityId = address.municipalityId;
      this.selectedRegionName = address.regionName ?? '';
    } else {
      // Adresse sans commune résolue : proposer la recherche par code postal.
      this.resolvedMunicipalities = [];
      this.model.municipalityId = '';
      this.selectedRegionName = '';
      this.searchPostal();
    }
  }

  toggleTag(id: string): void {
    const index = this.model.tagIds.indexOf(id);
    if (index >= 0) {
      this.model.tagIds.splice(index, 1);
    } else {
      this.model.tagIds.push(id);
    }
  }

  onActivityChange(): void {
    // Type/Format/Modalités sont transverses. Seuls les **Sujets** (Axe A) dépendent de l'activité :
    // on recharge et on réinitialise leur sélection.
    this.subjects = [];
    this.model.subjectIds = [];
    if (!this.model.activityId) {
      return;
    }
    this.referenceData.subjects(this.model.activityId).subscribe((items) => {
      this.subjects = items;
      this.applyDraftSubjects();
    });
  }

  toggleModality(id: string): void {
    const index = this.model.modalityIds.indexOf(id);
    if (index >= 0) {
      this.model.modalityIds.splice(index, 1);
    } else {
      this.model.modalityIds.push(id);
    }
  }

  submit(): void {
    this.error = '';
    if (!this.model.title.trim() || !this.model.activityId || !this.model.startsAt) {
      this.error = 'Titre, activité et date de début sont obligatoires.';
      return;
    }

    const input: CreateEventInput = {
      activityId: this.model.activityId,
      title: this.model.title.trim(),
      startsAt: toIso(this.model.startsAt),
    };
    if (this.model.eventTypeId) input.eventTypeId = this.model.eventTypeId;
    if (this.model.organizerId) input.organizerId = this.model.organizerId;
    if (this.model.venueId) input.venueId = this.model.venueId;
    if (this.model.municipalityId) input.municipalityId = this.model.municipalityId;
    if (this.model.tagIds.length) input.tagIds = [...this.model.tagIds];
    if (this.model.subjectIds.length) input.subjectIds = [...this.model.subjectIds];
    if (this.model.modalityIds.length) input.modalityIds = [...this.model.modalityIds];
    if (this.model.description.trim()) input.description = this.model.description.trim();
    if (this.model.endsAt) input.endsAt = toIso(this.model.endsAt);
    if (this.model.price != null && !Number.isNaN(this.model.price) && this.model.price > 0) {
      input.price = Number(this.model.price);
    }
    if (this.model.currency.trim()) input.currency = this.model.currency.trim().toUpperCase();

    this.save.emit(input);
  }

  private applyDraftScalars(): void {
    if (!this.draft) return;
    if (this.draft.title) this.model.title = this.draft.title;
    if (this.draft.description) this.model.description = this.draft.description;
    if (this.draft.startsAt) this.model.startsAt = toLocalInput(this.draft.startsAt);
    if (this.draft.endsAt) this.model.endsAt = toLocalInput(this.draft.endsAt);
    if (this.draft.price != null) this.model.price = this.draft.price;
    if (this.draft.currency) this.model.currency = this.draft.currency;
  }

  private applyDraftActivity(): void {
    if (!this.draft?.activityName) return;
    // Résolution alias-aware (Levier 2) : on reconnaît le libellé par nom OU par alias appris.
    const match = matchActivity(this.activities, this.draft.activityName);
    if (match) {
      this.model.activityId = match.id;
      this.onActivityChange();
    } else {
      this.unresolved.activity = this.draft.activityName;
    }
  }

  private applyDraftEventType(): void {
    if (!this.draft?.eventTypeName) return;
    const match = byName(this.eventTypes, this.draft.eventTypeName);
    if (match) this.model.eventTypeId = match.id;
    else this.unresolved.eventType = this.draft.eventTypeName;
  }

  /** Sujets détectés (noms) → sélection par identifiants (résolus une fois les sujets chargés). */
  private applyDraftSubjects(): void {
    if (!this.draft?.subjectNames?.length) return;
    for (const name of this.draft.subjectNames) {
      const match = byName(this.subjects, name);
      if (match && !this.model.subjectIds.includes(match.id)) {
        this.model.subjectIds = [...this.model.subjectIds, match.id];
      }
    }
  }

  /** Modalités détectées (noms) → sélection par identifiants (toutes dimensions confondues). */
  private applyDraftModalities(): void {
    if (!this.draft?.modalityNames?.length) return;
    const all = this.modalityDimensions.flatMap((dim) => dim.modalities);
    for (const name of this.draft.modalityNames) {
      const match = byName(all, name);
      if (match && !this.model.modalityIds.includes(match.id)) {
        this.model.modalityIds = [...this.model.modalityIds, match.id];
      }
    }
  }

  private applyDraftOrganizer(): void {
    if (!this.draft?.organizerName) return;
    const match = byName(this.organizers, this.draft.organizerName);
    if (match) this.model.organizerId = match.id;
    else this.unresolved.organizer = this.draft.organizerName;
  }

  private applyDraftVenue(): void {
    if (!this.draft?.venueName) return;
    const match = byName(this.venues, this.draft.venueName);
    if (match) this.model.venueId = match.id;
    else this.unresolved.venue = this.draft.venueName;
  }

  // --- Levier 2 : création / association d'un référentiel manquant, sans quitter la validation ---

  /** Crée l'activité manquante (sous le domaine choisi), la sélectionne et charge ses listes. */
  createActivityRef(): void {
    const name = this.unresolved.activity?.trim();
    if (!name || !this.newActivityDomainId) return;
    this.refError = '';
    this.referenceData.createActivity(name, this.newActivityDomainId).subscribe({
      next: (created) => {
        this.activities = [...this.activities, created].sort((a, b) => a.name.localeCompare(b.name));
        this.model.activityId = created.id;
        this.unresolved.activity = undefined;
        this.onActivityChange();
      },
      error: (err) => (this.refError = err?.error?.message ?? 'Création de l’activité impossible.'),
    });
  }

  /** Associe le libellé à une activité existante (crée un alias → le moteur apprend). */
  associateActivityRef(): void {
    const label = this.unresolved.activity?.trim();
    if (!label || !this.associateActivityId) return;
    const activityId = this.associateActivityId;
    this.refError = '';
    this.referenceData.createActivityAlias(activityId, label).subscribe({
      next: () => {
        this.model.activityId = activityId;
        this.unresolved.activity = undefined;
        this.associateActivityId = '';
        this.onActivityChange();
      },
      error: (err) => (this.refError = err?.error?.message ?? 'Association impossible.'),
    });
  }

  createEventTypeRef(): void {
    const name = this.unresolved.eventType?.trim();
    if (!name) return;
    this.refError = '';
    this.referenceData.createEventType(name).subscribe({
      next: (created) => {
        this.eventTypes = [...this.eventTypes, created];
        this.model.eventTypeId = created.id;
        this.unresolved.eventType = undefined;
      },
      error: (err) => (this.refError = err?.error?.message ?? 'Création du type impossible.'),
    });
  }

  createOrganizerRef(): void {
    const name = this.unresolved.organizer?.trim();
    if (!name) return;
    this.refError = '';
    this.referenceData.createOrganizer(name).subscribe({
      next: (created) => {
        this.organizers = [...this.organizers, created].sort((a, b) => a.name.localeCompare(b.name));
        this.model.organizerId = created.id;
        this.unresolved.organizer = undefined;
      },
      error: (err) => (this.refError = err?.error?.message ?? 'Création de l’organisateur impossible.'),
    });
  }

  createVenueRef(): void {
    const name = this.unresolved.venue?.trim();
    if (!name) return;
    this.refError = '';
    this.referenceData.createVenue(name).subscribe({
      next: (created) => {
        this.venues = [...this.venues, created].sort((a, b) => a.name.localeCompare(b.name));
        this.model.venueId = created.id;
        this.unresolved.venue = undefined;
      },
      error: (err) => (this.refError = err?.error?.message ?? 'Création du lieu impossible.'),
    });
  }
}

function byName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const needle = name.trim().toLowerCase();
  return items.find((i) => i.name.trim().toLowerCase() === needle);
}

/** Reconnaît une activité par son nom ou l'un de ses alias appris (résolution alias-aware). */
function matchActivity(items: ActivityDto[], label: string): ActivityDto | undefined {
  const needle = label.trim().toLowerCase();
  return items.find(
    (a) =>
      a.name.trim().toLowerCase() === needle ||
      (a.aliases ?? []).some((alias) => alias.trim().toLowerCase() === needle),
  );
}

/** `datetime-local` (heure locale, sans zone) → ISO 8601 UTC pour l'API. */
function toIso(local: string): string {
  return new Date(local).toISOString();
}

/** ISO 8601 UTC → valeur `datetime-local` (heure locale) pour préremplir un input. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}
