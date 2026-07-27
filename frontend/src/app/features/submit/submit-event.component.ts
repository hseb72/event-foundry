import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EventCandidatesApi } from '../../core/api/event-candidates.service';
import { ImportsApi } from '../../core/api/imports.service';
import {
  CreateEventInput,
  EventCandidateDetailDto,
  EventCandidateDto,
  EventDraft,
  ImportResponse,
} from '../../core/models';
import { EventFormComponent } from '../../shared/event-form.component';

/**
 * Entonnoir de soumission Explorer (FSPEC.22 §5-6, §15). L'utilisateur soumet une source (texte, URL
 * ou image), suit ses propres soumissions, puis qualifie et valide chaque brouillon détecté → un
 * **événement privé** (visible de lui seul, jamais publié). Réutilise le pipeline commun ; le
 * scoping par créateur est appliqué côté API.
 */
@Component({
  selector: 'app-submit-event',
  standalone: true,
  imports: [FormsModule, RouterLink, EventFormComponent, DatePipe],
  styles: [
    `
      .intro {
        color: var(--muted);
        margin: 0 0 1rem;
      }
      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: 1fr;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
        padding: 1rem 1.1rem;
      }
      .tabs {
        display: flex;
        gap: 0.3rem;
        background: var(--surface-2);
        border-radius: 12px;
        padding: 0.25rem;
        width: fit-content;
        margin-bottom: 0.8rem;
      }
      .tabs button {
        border: 0;
        background: transparent;
        color: var(--muted);
        border-radius: 9px;
        padding: 0.4rem 0.9rem;
        font-weight: 600;
      }
      .tabs button.on {
        background: var(--exp);
        color: var(--exp-contrast, #fff);
      }
      textarea,
      input[type='url'] {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.55rem 0.7rem;
        font: inherit;
        background: var(--bg);
        color: var(--text);
      }
      textarea {
        min-height: 8rem;
        resize: vertical;
      }
      .row {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        margin-top: 0.6rem;
        flex-wrap: wrap;
      }
      .sub {
        display: flex;
        justify-content: space-between;
        gap: 0.6rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.4rem;
        align-items: center;
      }
      .badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--surface-2);
      }
      .badge.running { color: #b45309; background: rgba(234, 179, 8, 0.15); }
      .badge.done { color: #16a34a; background: rgba(22, 163, 74, 0.14); }
      .badge.failed { color: var(--red); background: rgba(220, 38, 38, 0.14); }
      .draft-item {
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.4rem;
        cursor: pointer;
      }
      .draft-item.on { border-color: var(--exp); box-shadow: 0 0 0 1px var(--exp); }
      .muted { color: var(--muted); }
      .ok {
        background: rgba(22, 163, 74, 0.12);
        border: 1px solid rgba(22, 163, 74, 0.4);
        border-radius: 10px;
        padding: 0.6rem 0.9rem;
        margin-bottom: 0.8rem;
      }
      .hold {
        background: rgba(234, 179, 8, 0.14);
        border: 1px solid rgba(234, 179, 8, 0.4);
        border-radius: 8px;
        padding: 0.6rem 0.9rem;
      }
      .err { color: var(--red); }
      h2 { font-size: 1rem; margin: 0 0 0.6rem; }
    `,
  ],
  template: `
    <h1>Soumettre un événement</h1>
    <p class="intro">
      Transmettez une affiche, un texte ou un lien : nous en extrayons les événements. Après
      validation, chaque événement devient un <strong>événement privé</strong>, visible de vous seul —
      vous pourrez le suivre dans votre planning sans qu'il soit publié.
    </p>

    @if (message()) { <div class="ok">✅ {{ message() }} <a routerLink="/my-events">Voir mes événements privés</a></div> }

    <div class="grid">
      <!-- Soumission -->
      <section class="card">
        <h2>Nouvelle soumission</h2>
        <div class="tabs">
          <button [class.on]="tab() === 'text'" (click)="tab.set('text')">Texte</button>
          <button [class.on]="tab() === 'url'" (click)="tab.set('url')">Lien (URL)</button>
          <button [class.on]="tab() === 'image'" (click)="tab.set('image')">Image</button>
        </div>

        @if (tab() === 'text') {
          <textarea [(ngModel)]="text" placeholder="Collez l'annonce de l'événement…"></textarea>
          <div class="row">
            <button class="btn btn-primary" [disabled]="busy() || !text.trim()" (click)="submitText()">
              {{ busy() ? 'Envoi…' : 'Analyser le texte' }}
            </button>
          </div>
        } @else if (tab() === 'url') {
          <input type="url" [(ngModel)]="url" placeholder="https://…" />
          <div class="row">
            <button class="btn btn-primary" [disabled]="busy() || !url.trim()" (click)="submitUrl()">
              {{ busy() ? 'Envoi…' : 'Capturer la page' }}
            </button>
          </div>
        } @else {
          <input type="file" accept="image/*" (change)="onFile($event)" />
          <div class="row">
            <button class="btn btn-primary" [disabled]="busy() || !file" (click)="submitImage()">
              {{ busy() ? 'Envoi…' : 'Analyser l\\'image' }}
            </button>
            <span class="muted">L'analyse est asynchrone : vos brouillons apparaissent ci-dessous.</span>
          </div>
        }
        @if (error()) { <p class="err">{{ error() }}</p> }
      </section>

      <!-- Mes soumissions -->
      <section class="card">
        <h2>Mes soumissions <button class="btn btn-sm" (click)="refresh()">↻</button></h2>
        @if (!submissions().length) {
          <p class="muted">Aucune soumission pour l'instant.</p>
        } @else {
          @for (s of submissions(); track s.id) {
            <div class="sub">
              <span>{{ s.type }} · {{ s.createdAt | date: 'short' }}</span>
              <span>
                <span class="badge" [class.running]="isRunning(s)" [class.done]="isDone(s)" [class.failed]="s.status === 'FAILED'">
                  {{ statusLabel(s.status) }}
                </span>
                @if (s.candidateCount > 0) { <span class="badge">{{ s.candidateCount }} brouillon(s)</span> }
              </span>
            </div>
          }
        }
      </section>

      <!-- Qualification -->
      <section class="card">
        <h2>À qualifier</h2>
        @if (!drafts().length) {
          <p class="muted">Aucun brouillon à qualifier. Soumettez une source ci-dessus.</p>
        } @else {
          @for (d of drafts(); track d.id) {
            <div class="draft-item" [class.on]="selected()?.id === d.id" (click)="select(d)">
              <strong>{{ draftTitle(d) }}</strong>
              <span class="muted"> · {{ d.createdAt | date: 'short' }}</span>
            </div>
          }
        }

        @if (holdNotice()) { <p class="hold">⏸️ {{ holdNotice() }}</p> }

        @if (selected(); as sel) {
          <div style="margin-top:0.8rem">
            <h2>Qualifier ce brouillon</h2>
            <app-event-form
              [draft]="draft()"
              submitLabel="Valider → mon événement privé"
              [showReject]="true"
              [busy]="busy()"
              (save)="validate($event)"
              (reject)="reject(sel.id)"
            />
          </div>
        }
      </section>
    </div>
  `,
})
export class SubmitEventComponent implements OnInit {
  private readonly imports = inject(ImportsApi);
  private readonly candidates = inject(EventCandidatesApi);

  readonly tab = signal<'text' | 'url' | 'image'>('text');
  readonly submissions = signal<ImportResponse[]>([]);
  readonly drafts = signal<EventCandidateDto[]>([]);
  readonly selected = signal<EventCandidateDetailDto | null>(null);
  readonly draft = signal<EventDraft | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly holdNotice = signal('');
  readonly error = signal('');

  text = '';
  url = '';
  file: File | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.imports.listMine().subscribe({ next: (list) => this.submissions.set(list) });
    this.candidates.listMine('PENDING').subscribe({ next: (list) => this.drafts.set(list) });
  }

  onFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  submitText(): void {
    this.run(this.imports.importText(this.text), () => (this.text = ''));
  }

  submitUrl(): void {
    this.run(this.imports.importUrl(this.url), () => (this.url = ''));
  }

  submitImage(): void {
    if (!this.file) return;
    this.run(this.imports.uploadFile(this.file), () => (this.file = null));
  }

  private run(obs: Observable<ImportResponse>, onDone: () => void): void {
    this.busy.set(true);
    this.error.set('');
    obs.subscribe({
      next: () => {
        this.busy.set(false);
        onDone();
        this.message.set("Soumission envoyée : l'analyse est en cours.");
        this.refresh();
      },
      error: (err: { error?: { message?: string } }) => {
        this.busy.set(false);
        this.error.set(err?.error?.message ?? 'La soumission a échoué.');
      },
    });
  }

  select(candidate: EventCandidateDto): void {
    this.holdNotice.set('');
    this.candidates.detail(candidate.id).subscribe({
      next: (detail) => {
        this.selected.set(detail);
        this.draft.set(toDraft(detail.payload));
      },
    });
  }

  validate(input: CreateEventInput): void {
    const sel = this.selected();
    if (!sel) return;
    this.busy.set(true);
    this.holdNotice.set('');
    this.candidates.validate(sel.id, input).subscribe({
      next: () => {
        this.busy.set(false);
        this.selected.set(null);
        this.message.set('Événement privé créé.');
        this.refresh();
      },
      error: (err: { error?: { code?: string; message?: string } }) => {
        this.busy.set(false);
        if (err?.error?.code === 'SUBMISSION_HELD_FOR_REVIEW') {
          this.holdNotice.set(err.error.message ?? 'Validation retenue pour vérification.');
        } else {
          this.error.set(err?.error?.message ?? 'La validation a échoué.');
        }
      },
    });
  }

  reject(id: string): void {
    this.busy.set(true);
    this.candidates.reject(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.selected.set(null);
        this.refresh();
      },
      error: () => this.busy.set(false),
    });
  }

  draftTitle(d: EventCandidateDto): string {
    const t = d.payload?.['title'];
    return typeof t === 'string' && t.trim() ? t : 'Brouillon sans titre';
  }

  isRunning(s: ImportResponse): boolean {
    return s.status.endsWith('_RUNNING') || s.status === 'PENDING';
  }
  isDone(s: ImportResponse): boolean {
    return s.status === 'COMPLETED' || s.status === 'READY_FOR_VALIDATION';
  }
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      OCR_RUNNING: 'Analyse…',
      OCR_DONE: 'Analyse OK',
      CLASSIFICATION_RUNNING: 'Extraction…',
      READY_FOR_VALIDATION: 'Prêt à qualifier',
      COMPLETED: 'Terminé',
      FAILED: 'Échec',
    };
    return map[status] ?? status;
  }
}

function toDraft(payload: Record<string, unknown>): EventDraft {
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
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
    eventFormatName: str(payload['eventFormat']),
    organizerName: str(payload['organizer']),
    venueName: str(payload['venue']),
  };
}
