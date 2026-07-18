import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReferenceDataApi } from '../core/api/reference-data.service';
import { ActivityDto, CreateEventInput, EventDraft, ReferentialItem } from '../core/models';

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
        </div>
        <div>
          <label>Type d'événement</label>
          <select class="select" [(ngModel)]="model.eventTypeId" name="eventTypeId"
                  [disabled]="!model.activityId">
            <option value="">— aucun —</option>
            @for (t of eventTypes; track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Format</label>
          <select class="select" [(ngModel)]="model.eventFormatId" name="eventFormatId"
                  [disabled]="!model.activityId">
            <option value="">— aucun —</option>
            @for (f of eventFormats; track f.id) {
              <option [value]="f.id">{{ f.name }}</option>
            }
          </select>
        </div>
        <div>
          <label>Organisateur</label>
          <select class="select" [(ngModel)]="model.organizerId" name="organizerId">
            <option value="">— aucun —</option>
            @for (o of organizers; track o.id) {
              <option [value]="o.id">{{ o.name }}</option>
            }
          </select>
        </div>
      </div>

      <div>
        <label>Lieu</label>
        <select class="select" [(ngModel)]="model.venueId" name="venueId">
          <option value="">— aucun —</option>
          @for (v of venues; track v.id) {
            <option [value]="v.id">{{ v.name }}</option>
          }
        </select>
      </div>

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

  @Output() save = new EventEmitter<CreateEventInput>();
  @Output() reject = new EventEmitter<void>();

  activities: ActivityDto[] = [];
  eventTypes: ReferentialItem[] = [];
  eventFormats: ReferentialItem[] = [];
  organizers: ReferentialItem[] = [];
  venues: ReferentialItem[] = [];

  error = '';

  model = {
    title: '',
    description: '',
    activityId: '',
    eventTypeId: '',
    eventFormatId: '',
    organizerId: '',
    venueId: '',
    startsAt: '',
    endsAt: '',
    price: null as number | null,
    currency: '',
  };

  constructor(private readonly referenceData: ReferenceDataApi) {}

  ngOnInit(): void {
    this.referenceData.organizers().subscribe((items) => {
      this.organizers = items;
      this.applyDraftOrganizer();
    });
    this.referenceData.venues().subscribe((items) => {
      this.venues = items;
      this.applyDraftVenue();
    });
    this.referenceData.activities().subscribe((items) => {
      this.activities = items;
      this.applyDraftScalars();
      this.applyDraftActivity();
    });
  }

  onActivityChange(): void {
    this.eventTypes = [];
    this.eventFormats = [];
    this.model.eventTypeId = '';
    this.model.eventFormatId = '';
    if (!this.model.activityId) {
      return;
    }
    this.referenceData.eventTypes(this.model.activityId).subscribe((items) => {
      this.eventTypes = items;
      this.applyDraftEventType();
    });
    this.referenceData.eventFormats(this.model.activityId).subscribe((items) => {
      this.eventFormats = items;
      this.applyDraftEventFormat();
    });
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
    if (this.model.eventFormatId) input.eventFormatId = this.model.eventFormatId;
    if (this.model.organizerId) input.organizerId = this.model.organizerId;
    if (this.model.venueId) input.venueId = this.model.venueId;
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
    const match = byName(this.activities, this.draft.activityName);
    if (match) {
      this.model.activityId = match.id;
      this.onActivityChange();
    }
  }

  private applyDraftEventType(): void {
    if (!this.draft?.eventTypeName) return;
    const match = byName(this.eventTypes, this.draft.eventTypeName);
    if (match) this.model.eventTypeId = match.id;
  }

  private applyDraftEventFormat(): void {
    if (!this.draft?.eventFormatName) return;
    const match = byName(this.eventFormats, this.draft.eventFormatName);
    if (match) this.model.eventFormatId = match.id;
  }

  private applyDraftOrganizer(): void {
    if (!this.draft?.organizerName) return;
    const match = byName(this.organizers, this.draft.organizerName);
    if (match) this.model.organizerId = match.id;
  }

  private applyDraftVenue(): void {
    if (!this.draft?.venueName) return;
    const match = byName(this.venues, this.draft.venueName);
    if (match) this.model.venueId = match.id;
  }
}

function byName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const needle = name.trim().toLowerCase();
  return items.find((i) => i.name.trim().toLowerCase() === needle);
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
