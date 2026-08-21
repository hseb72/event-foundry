import { SlicePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventCandidatesApi } from '../../core/api/event-candidates.service';
import { ToastService } from '../../core/toast.service';
import {
  CreateEventInput,
  EventCandidateDetailDto,
  EventCandidateDto,
  EventDraft,
} from '../../core/models';
import { EventFormComponent } from '../../shared/event-form.component';

/**
 * File de validation : liste les EventCandidate issus du pipeline (OCR + moteur expert),
 * affiche le brouillon proposé (payload) avec ses scores de confiance et le texte OCR
 * source, puis permet de valider (→ Event) ou rejeter. Corriger revient à ajuster le
 * formulaire avant validation.
 */
@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [FormsModule, SlicePipe, EventFormComponent],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.css',
})
export class ValidationComponent implements OnInit {
  private readonly api = inject(EventCandidatesApi);

  candidates: EventCandidateDto[] = [];
  selected: EventCandidateDetailDto | null = null;
  draft: EventDraft | null = null;
  confidenceEntries: { key: string; value: number }[] = [];

  statusFilter = 'PENDING';
  loading = false;
  detailLoading = false;
  busy = false;
  actionError = '';
  /** Message « validation retenue pour vérification » (FSPEC.22 §13, 422). */
  holdNotice = '';

  ngOnInit(): void {
    this.reload();
  }

  get editable(): boolean {
    return this.selected?.status === 'PENDING' || this.selected?.status === 'CORRECTED';
  }

  reload(): void {
    this.loading = true;
    this.selected = null;
    this.draft = null;
    this.api.list(this.statusFilter || undefined).subscribe({
      next: (items) => {
        this.candidates = items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  select(candidate: EventCandidateDto): void {
    this.detailLoading = true;
    this.actionError = '';
    this.selected = null;
    this.draft = null;
    this.api.detail(candidate.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.draft = toDraft(detail.payload);
        this.confidenceEntries = Object.entries(detail.confidence ?? {}).map(([key, value]) => ({
          key,
          value: Number(value),
        }));
        this.detailLoading = false;
      },
      error: () => (this.detailLoading = false),
    });
  }

  private readonly toast = inject(ToastService);

  onValidate(input: CreateEventInput): void {
    if (!this.selected) return;
    this.busy = true;
    this.actionError = '';
    this.holdNotice = '';
    this.api.validate(this.selected.id, input).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('Brouillon validé', "L'événement a été créé.");
        this.reload();
      },
      error: (err) => {
        this.busy = false;
        // 422 SUBMISSION_HELD_FOR_REVIEW (§13) : ce n'est pas un échec — une Case a été ouverte, le
        // candidat reste modifiable. On l'affiche comme une mise en attente plutôt qu'une erreur.
        if (err?.error?.code === 'SUBMISSION_HELD_FOR_REVIEW') {
          this.holdNotice = err.error.message;
          this.toast.info('Validation retenue pour vérification', err.error.message);
        } else {
          this.actionError = 'La validation a échoué.';
          this.toast.fromHttp('Validation refusée', err);
        }
      },
    });
  }

  onReject(): void {
    if (!this.selected) return;
    this.busy = true;
    this.actionError = '';
    this.api.reject(this.selected.id).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success('Brouillon rejeté');
        this.reload();
      },
      error: (err) => {
        this.busy = false;
        this.actionError = 'Le rejet a échoué.';
        this.toast.fromHttp('Rejet impossible', err);
      },
    });
  }

  payloadTitle(c: EventCandidateDto): string {
    const title = c.payload['title'];
    return typeof title === 'string' && title.trim() ? title : '(sans titre)';
  }

  percent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  confidenceClass(value: number): string {
    if (value < 0.4) return 'low';
    if (value < 0.7) return 'mid';
    return 'high';
  }
}

/** Traduit le payload (noms détectés) du candidat en EventDraft pour préremplir le formulaire. */
function toDraft(payload: Record<string, unknown>): EventDraft {
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v : undefined;
  const num = (v: unknown): number | undefined =>
    typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
  return {
    title: str(payload['title']),
    description: str(payload['description']),
    startsAt: str(payload['startsAt']),
    endsAt: str(payload['endsAt']),
    price: num(payload['price']),
    currency: str(payload['currency']),
    activityName: str(payload['activity']),
    eventTypeName: str(payload['eventType']),
    organizerName: str(payload['organizer']),
    venueName: str(payload['venue']),
  };
}
