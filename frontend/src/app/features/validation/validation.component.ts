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
  styles: [
    `
      .split {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 1.5rem;
        align-items: start;
      }
      .list {
        display: grid;
        gap: 0.5rem;
      }
      .item {
        text-align: left;
        width: 100%;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
        cursor: pointer;
      }
      .item.selected {
        border-color: var(--exp);
        box-shadow: 0 0 0 1px var(--exp);
      }
      .item small {
        color: var(--muted);
      }
      .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.06);
      }
      .conf {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.5rem 0 1rem;
      }
      .chip {
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.05);
      }
      .chip.low {
        background: rgba(192, 57, 43, 0.12);
        color: #c0392b;
      }
      .chip.mid {
        background: rgba(230, 126, 34, 0.14);
        color: #b9651a;
      }
      .chip.high {
        background: rgba(39, 174, 96, 0.14);
        color: #1e8a4c;
      }
      .ocr {
        white-space: pre-wrap;
        font-family: ui-monospace, monospace;
        font-size: 0.8rem;
        max-height: 200px;
        overflow: auto;
        background: rgba(0, 0, 0, 0.04);
        padding: 0.7rem;
        border-radius: 8px;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
      @media (max-width: 720px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <h1>Validation</h1>
    <p class="muted">Candidats proposés par le pipeline OCR + moteur expert.</p>

    <div class="filters" style="margin: 0.5rem 0 1rem">
      <select class="select" [(ngModel)]="statusFilter" (ngModelChange)="reload()" style="max-width: 220px">
        <option value="PENDING">À traiter (PENDING)</option>
        <option value="CORRECTED">Corrigés</option>
        <option value="VALIDATED">Validés</option>
        <option value="REJECTED">Rejetés</option>
        <option value="">Tous</option>
      </select>
    </div>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (candidates.length === 0) {
      <p class="empty">Aucun candidat pour ce statut.</p>
    } @else {
      <div class="split">
        <div class="list">
          @for (c of candidates; track c.id) {
            <button
              class="item"
              [class.selected]="selected?.id === c.id"
              (click)="select(c)"
            >
              <span class="badge">{{ c.status }}</span>
              <div>{{ payloadTitle(c) }}</div>
              <small>{{ c.createdAt | slice: 0 : 10 }}</small>
            </button>
          }
        </div>

        <div>
          @if (detailLoading) {
            <p class="muted">Chargement du candidat…</p>
          } @else if (selected) {
            <div class="card" style="margin-bottom: 1rem">
              <h3 style="margin-top: 0">Confiance par champ</h3>
              <div class="conf">
                @for (entry of confidenceEntries; track entry.key) {
                  <span class="chip" [class]="confidenceClass(entry.value)">
                    {{ entry.key }} · {{ percent(entry.value) }}
                  </span>
                }
                @if (confidenceEntries.length === 0) {
                  <span class="muted">Aucun score.</span>
                }
              </div>
              @if (selected.ocrText) {
                <h3>Texte OCR</h3>
                <div class="ocr">{{ selected.ocrText }}</div>
              }
            </div>

            @if (holdNotice) {
              <p
                style="background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 0.6rem 0.9rem;"
              >
                ⏸️ {{ holdNotice }}
              </p>
            }
            @if (actionError) {
              <p style="color: var(--red, #c0392b)">{{ actionError }}</p>
            }

            @if (editable) {
              <app-event-form
                [draft]="draft"
                submitLabel="Valider → créer l'événement"
                [showReject]="true"
                [busy]="busy"
                (save)="onValidate($event)"
                (reject)="onReject()"
              />
            } @else {
              <p class="muted">
                Ce candidat est {{ selected.status }} : il n'est plus modifiable (conservé pour audit).
              </p>
            }
          } @else {
            <p class="muted">Sélectionnez un candidat à gauche.</p>
          }
        </div>
      </div>
    }
  `,
})
export class ValidationComponent implements OnInit {
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

  constructor(private readonly api: EventCandidatesApi) {}

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
