import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  EventDto,
  ImportResponse,
} from '../../core/models';
import { EventsApi } from '../../core/api/events.service';
import { EventFormComponent } from '../../shared/event-form.component';
import { FileDropComponent } from '../../shared/file-drop.component';
import { formatDateTime } from '../../shared/date-format';

type SubmitTab = 'document' | 'text' | 'url' | 'structured' | 'create';
/** Colonnes triables (tri client — les listes privées personnelles restent de petite taille). */
type SortKey = 'startsAt' | 'title' | 'category' | 'status';

/**
 * Entonnoir de soumission Explorer (FSPEC.22 §5-6, §15) — homogénéisé avec l'expérience Organizer.
 * Une **seule** entrée « Mes événements privés » regroupe la soumission (box « Nouvelle soumission »
 * repliable, mêmes onglets : Documents, Texte, URL, Fichiers structurés, Création), le suivi des
 * soumissions en cours d'analyse, la validation des brouillons, et la liste des événements privés
 * sous forme de tableau (tri, pagination). Après validation, chaque brouillon devient un **événement
 * privé** (visible du seul créateur, jamais publié — ESUB-009) qui apparaît **ici**, jamais dans
 * l'expérience Organizer. Le scoping par créateur est appliqué côté API.
 */
@Component({
  selector: 'app-submit-event',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, EventFormComponent, FileDropComponent],
  styles: [
    `
      .intro { color: var(--muted); margin: 0 0 1rem; }
      .grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
      .card { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 1rem 1.1rem; }
      .box-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; }
      .box-head h2 { margin: 0; }
      .tabs { display: flex; flex-wrap: wrap; gap: 0.3rem; background: var(--surface-2); border-radius: 12px; padding: 0.25rem; width: fit-content; margin-bottom: 0.8rem; }
      .tabs button { border: 0; background: transparent; color: var(--muted); border-radius: 9px; padding: 0.4rem 0.9rem; font-weight: 600; }
      .tabs button.on { background: var(--exp); color: var(--exp-contrast, #fff); }
      textarea, input[type='url'] { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 0.55rem 0.7rem; font: inherit; background: var(--bg); color: var(--text); }
      textarea { min-height: 8rem; resize: vertical; }
      .row { display: flex; gap: 0.6rem; align-items: center; margin-top: 0.6rem; flex-wrap: wrap; }
      .ai { display: flex; gap: 0.45rem; align-items: center; font-size: 0.85rem; margin: 0.4rem 0; }
      .disclaimer { background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; margin: 0.5rem 0; }
      .sub { display: flex; justify-content: space-between; gap: 0.6rem; border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; align-items: center; }
      .badge { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; background: var(--surface-2); }
      .badge.running { color: #b45309; background: rgba(234, 179, 8, 0.15); }
      .draft-item { border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; cursor: pointer; }
      .draft-item.on { border-color: var(--exp); box-shadow: 0 0 0 1px var(--exp); }
      .muted { color: var(--muted); }
      .ok { background: rgba(22, 163, 74, 0.12); border: 1px solid rgba(22, 163, 74, 0.4); border-radius: 10px; padding: 0.6rem 0.9rem; margin-bottom: 0.8rem; }
      .hold { background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 0.6rem 0.9rem; }
      .err { color: var(--red); }
      h2 { font-size: 1rem; margin: 0 0 0.6rem; }
      .note { display: flex; align-items: center; gap: 0.5rem; background: var(--exp-weak, rgba(37, 99, 235, 0.1)); border: 1px solid var(--border); border-radius: 10px; padding: 0.6rem 0.9rem; margin: 0.2rem 0 0.6rem; font-size: 0.88rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
      th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      th .arr { color: var(--exp); }
      .pager { display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-top: 0.6rem; }
    `,
  ],
  template: `
    <h1>Mes événements privés</h1>
    <p class="intro">
      Vos événements personnels. Soumettez une affiche, un texte, un lien ou un fichier — ou créez
      directement un événement : après validation, chaque événement devient un
      <strong>événement privé</strong>, visible de vous seul, que vous pouvez suivre dans votre
      planning sans qu'il soit publié.
    </p>

    @if (message()) { <div class="ok">✅ {{ message() }}</div> }

    <div class="grid">
      <!-- Box « Nouvelle soumission » repliable -->
      <section class="card">
        <div class="box-head">
          <h2>Nouvelle soumission</h2>
          <button class="btn btn-sm" (click)="submitOpen.set(!submitOpen())" [attr.aria-expanded]="submitOpen()">
            {{ submitOpen() ? '▲ Réduire' : '▼ Étendre' }}
          </button>
        </div>

        @if (submitOpen()) {
          <div class="tabs">
            <button [class.on]="tab() === 'document'" (click)="tab.set('document')">Documents</button>
            <button [class.on]="tab() === 'text'" (click)="tab.set('text')">Texte</button>
            <button [class.on]="tab() === 'url'" (click)="tab.set('url')">URL</button>
            <button [class.on]="tab() === 'structured'" (click)="tab.set('structured')">Fichiers structurés</button>
            <button [class.on]="tab() === 'create'" (click)="tab.set('create')">Création</button>
          </div>

          @if (tab() === 'document') {
            <app-file-drop accept="image/png,image/jpeg,application/pdf"
              hint="JPG, PNG ou PDF — glisser-déposer, parcourir ou coller" (fileSelected)="file = $event" />
            <label class="ai"><input type="checkbox" [(ngModel)]="fileUseAi" [disabled]="isPdf()" />
              Extraction assistée par IA <span class="muted">(image, si configurée)</span></label>
            <div class="row">
              <button class="btn btn-primary" [disabled]="!file || busy()" (click)="submitDocument()">Analyser le document</button>
            </div>
          } @else if (tab() === 'text') {
            <textarea [(ngModel)]="text" placeholder="Collez l'annonce de l'événement…"></textarea>
            <label class="ai"><input type="checkbox" [(ngModel)]="useAi" /> Extraction assistée par IA <span class="muted">(si configurée)</span></label>
            <div class="row">
              <button class="btn btn-primary" [disabled]="busy() || !text.trim()" (click)="submitText()">Analyser le texte</button>
            </div>
          } @else if (tab() === 'url') {
            <input type="url" [(ngModel)]="url" placeholder="https://…" />
            <div class="disclaimer">
              ⚠️ Les pages nécessitant une authentification (connexion, espace privé) peuvent ne pas
              donner de bons résultats : la capture ne voit que le contenu public de la page.
            </div>
            <div class="row">
              <button class="btn btn-primary" [disabled]="busy() || !url.trim()" (click)="submitUrl()">Capturer la page</button>
            </div>
          } @else if (tab() === 'structured') {
            <p class="muted" style="font-size:0.82rem;margin:0 0 0.5rem">
              Canal 100 % déterministe (sans OCR ni IA). Colonnes/clés :
              <code>title, starts_at, activity, event_type, venue, city, price, url…</code> ·
              requis : <code>title</code>, <code>starts_at</code>. Chaque ligne devient un événement à valider.
            </p>
            <app-file-drop accept=".csv,.json,text/csv,application/json"
              hint="Fichier CSV ou JSON — ou collez le contenu ci-dessous" (fileSelected)="onStructuredFile($event)" />
            <textarea [(ngModel)]="structured" style="margin-top:0.5rem"
              placeholder="key,title,starts_at&#10;t1,Tournoi Magic,2026-08-01T18:00:00Z"></textarea>
            <div class="row">
              <button class="btn btn-primary" [disabled]="busy() || !structured.trim()" (click)="submitStructured()">Importer le contenu structuré</button>
            </div>
          } @else {
            <app-event-form submitLabel="Créer mon événement privé" [busy]="createBusy()" (save)="onCreate($event)" />
            @if (createMsg()) { <p class="muted" style="margin:0.4rem 0 0">{{ createMsg() }}</p> }
          }
          @if (error()) { <p class="err">{{ error() }}</p> }
        }
      </section>

      <!-- Soumissions en cours d'analyse (visible seulement s'il y en a) -->
      @if (inAnalysis().length) {
        <section class="card">
          <h2>Soumissions <span class="muted">(analyse en cours)</span></h2>
          @for (s of inAnalysis(); track s.id) {
            <div class="sub">
              <span>{{ s.type }} · {{ s.createdAt | date: 'short' }}</span>
              <span class="badge running">{{ statusLabel(s.status) }}</span>
            </div>
          }
        </section>
      }

      <!-- Validation des brouillons (visible seulement s'il y en a) -->
      @if (drafts().length || selected()) {
        <section class="card">
          <h2>Validation <span class="muted">(brouillons à qualifier)</span></h2>
          @for (d of drafts(); track d.id) {
            <div class="draft-item" [class.on]="selected()?.id === d.id" (click)="select(d)">
              <strong>{{ draftTitle(d) }}</strong>
              <span class="muted"> · {{ d.createdAt | date: 'short' }}</span>
            </div>
          }
          @if (holdNotice()) { <p class="hold">⏸️ {{ holdNotice() }}</p> }
          @if (selected(); as sel) {
            <div style="margin-top:0.8rem">
              <h2>Qualifier ce brouillon</h2>
              <app-event-form [draft]="draft()" submitLabel="Valider → mon événement privé" [showReject]="true"
                [busy]="busy()" (save)="validate($event)" (reject)="reject(sel.id)" />
            </div>
          }
        </section>
      }

      <!-- Mes événements : tableau trié / paginé -->
      <section class="card">
        <h2>Mes événements</h2>
        <div class="note">
          🔒 Une fois qualifiés, vos événements privés apparaissent <strong>ici</strong> — jamais dans
          l'expérience Organizer. Un événement privé n'est jamais publié au catalogue.
        </div>
        @if (loading()) {
          <p class="muted">Chargement…</p>
        } @else if (!events().length) {
          <p class="muted">Aucun événement privé pour l'instant. Validez un brouillon ou créez-en un ci-dessus.</p>
        } @else {
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th class="sortable" (click)="sort('startsAt')">Date début <span class="arr">{{ arrow('startsAt') }}</span></th>
                  <th class="sortable" (click)="sort('title')">Titre <span class="arr">{{ arrow('title') }}</span></th>
                  <th class="sortable" (click)="sort('category')">Sujets <span class="arr">{{ arrow('category') }}</span></th>
                  <th>Archivage</th>
                </tr>
              </thead>
              <tbody>
                @for (e of paged(); track e.id) {
                  <tr>
                    <td>{{ date(e) }}</td>
                    <td><a [routerLink]="['/events', e.id]">{{ e.title }}</a></td>
                    <td>{{ categoryOf(e) }}</td>
                    <td>
                      @if (e.status === 'ARCHIVED') {
                        <button class="btn btn-sm" [disabled]="busyRow() === e.id" (click)="rowAction(e, 'restore')">Restaurer</button>
                      } @else {
                        <button class="btn btn-sm" [disabled]="busyRow() === e.id" (click)="rowAction(e, 'archive')">Archiver</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pager">
            <span class="muted">{{ events().length }} événement(s) · page {{ page() + 1 }}/{{ pageCount() }}</span>
            <button class="btn btn-sm" [disabled]="page() === 0" (click)="page.set(page() - 1)">‹</button>
            <button class="btn btn-sm" [disabled]="page() >= pageCount() - 1" (click)="page.set(page() + 1)">›</button>
          </div>
        }
        @if (error()) { <p class="err">{{ error() }}</p> }
      </section>
    </div>
  `,
})
export class SubmitEventComponent implements OnInit {
  private readonly imports = inject(ImportsApi);
  private readonly candidates = inject(EventCandidatesApi);
  private readonly eventsApi = inject(EventsApi);

  readonly submitOpen = signal(false);
  readonly tab = signal<SubmitTab>('document');
  readonly submissions = signal<ImportResponse[]>([]);
  readonly drafts = signal<EventCandidateDto[]>([]);
  readonly events = signal<EventDto[]>([]);
  readonly selected = signal<EventCandidateDetailDto | null>(null);
  readonly draft = signal<EventDraft | null>(null);
  readonly busy = signal(false);
  readonly busyRow = signal<string | null>(null);
  readonly loading = signal(true);
  readonly message = signal('');
  readonly holdNotice = signal('');
  readonly error = signal('');
  readonly createBusy = signal(false);
  readonly createMsg = signal('');

  file: File | null = null;
  fileUseAi = false;
  text = '';
  useAi = false;
  url = '';
  structured = '';

  // Tri + pagination du tableau (côté client : listes privées personnelles de petite taille).
  readonly sortKey = signal<SortKey>('startsAt');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(0);
  readonly pageSize = 10;

  /** Soumissions encore en cours d'analyse (ni terminées, ni en échec, ni prêtes à valider). */
  readonly inAnalysis = computed(() =>
    this.submissions().filter((s) => !['COMPLETED', 'FAILED', 'READY_FOR_VALIDATION'].includes(s.status)),
  );

  readonly sorted = computed(() => {
    const key = this.sortKey();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.events()].sort((a, b) => this.compare(a, b, key) * dir);
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.events().length / this.pageSize)));
  readonly paged = computed(() => this.sorted().slice(this.page() * this.pageSize, (this.page() + 1) * this.pageSize));

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.imports.listMine().subscribe({ next: (list) => this.submissions.set(list) });
    this.candidates.listMine('PENDING').subscribe({ next: (list) => this.drafts.set(list) });
    this.eventsApi.myPrivateEvents().subscribe({
      next: (page) => {
        this.events.set(page.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // --- Soumission ---

  isPdf(): boolean {
    return this.file?.type === 'application/pdf';
  }

  onStructuredFile(file: File): void {
    void file.text().then((content) => (this.structured = content));
  }

  submitDocument(): void {
    if (!this.file) return;
    const useAi = this.fileUseAi && !this.isPdf();
    this.run(useAi ? this.imports.aiExtractFile(this.file) : this.imports.uploadFile(this.file), () => {
      this.file = null;
      this.fileUseAi = false;
    });
  }

  submitText(): void {
    this.run(this.useAi ? this.imports.importAiExtract(this.text) : this.imports.importText(this.text), () => (this.text = ''));
  }

  submitUrl(): void {
    this.run(this.imports.importUrl(this.url), () => (this.url = ''));
  }

  submitStructured(): void {
    this.run(this.imports.importStructured(this.structured), () => (this.structured = ''));
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

  onCreate(input: CreateEventInput): void {
    this.createBusy.set(true);
    this.createMsg.set('');
    this.eventsApi.createPrivate(input).subscribe({
      next: () => {
        this.createBusy.set(false);
        this.createMsg.set('✅ Événement privé créé.');
        this.message.set('Événement privé créé.');
        this.refresh();
      },
      error: (err: { error?: { message?: string } }) => {
        this.createBusy.set(false);
        this.createMsg.set(err?.error?.message ?? 'La création a échoué.');
      },
    });
  }

  // --- Validation ---

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

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente',
      OCR_RUNNING: 'Analyse…',
      OCR_DONE: 'Analyse OK',
      CLASSIFICATION_RUNNING: 'Extraction…',
      DISCOVERING: 'Découverte…',
      FETCHING: 'Récupération…',
      EXTRACTING: 'Extraction…',
      VALIDATING: 'Contrôles…',
      NORMALIZING: 'Normalisation…',
      DEDUPLICATING: 'Dédoublonnage…',
      PERSISTING: 'Enregistrement…',
    };
    return map[status] ?? status;
  }

  // --- Tableau des événements privés ---

  date(e: EventDto): string {
    return formatDateTime(e.startsAt);
  }

  categoryOf(e: EventDto): string {
    return e.subjects?.length ? e.subjects.join(', ') : '—';
  }

  sort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(0);
  }

  arrow(key: SortKey): string {
    return this.sortKey() === key ? (this.sortDir() === 'asc' ? '▲' : '▼') : '';
  }

  private compare(a: EventDto, b: EventDto, key: SortKey): number {
    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'category':
        return this.categoryOf(a).localeCompare(this.categoryOf(b));
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return a.startsAt.localeCompare(b.startsAt);
    }
  }

  rowAction(e: EventDto, action: 'archive' | 'restore'): void {
    this.busyRow.set(e.id);
    this.error.set('');
    const call = action === 'archive' ? this.eventsApi.archivePrivate(e.id) : this.eventsApi.restorePrivate(e.id);
    call.subscribe({
      next: (updated) => {
        this.events.update((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
        this.busyRow.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.busyRow.set(null);
        this.error.set(err?.error?.message ?? "L'action a échoué.");
      },
    });
  }
}

function toDraft(payload: Record<string, unknown>): EventDraft {
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
  const num = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
  const strList = (v: unknown): string[] | undefined =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : undefined;
  return {
    title: str(payload['title']),
    description: str(payload['description']),
    startsAt: str(payload['startsAt']),
    endsAt: str(payload['endsAt']),
    price: num(payload['price']),
    currency: str(payload['currency']),
    activityName: str(payload['activity']),
    eventTypeName: str(payload['eventType']),
    subjectNames: strList(payload['subjects']),
    modalityNames: strList(payload['modalities']),
    organizerName: str(payload['organizer']),
    venueName: str(payload['venue']),
  };
}
