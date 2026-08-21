import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EventCandidatesApi } from '../../core/api/event-candidates.service';
import { ImportsApi } from '../../core/api/imports.service';
import { EventsApi } from '../../core/api/events.service';
import { ToastService } from '../../core/toast.service';
import {
  CreateEventInput,
  EventCandidateDetailDto,
  EventCandidateDto,
  EventDraft,
  EventDto,
  ImportResponse,
} from '../../core/models';
import { EventFormComponent } from '../../shared/event-form.component';
import { FileDropComponent } from '../../shared/file-drop.component';
import { formatDateTime } from '../../shared/date-format';
import { IconComponent } from '../../shared/icon.component';
import { eventCoverBackground } from '../../shared/event-cover';

type SubmitTab = 'document' | 'text' | 'url' | 'structured' | 'create';
/** Colonnes triables côté serveur (le tri directionnel s'applique à la page courante paginée). */
type SortKey = 'startsAt' | 'title' | 'status';

/**
 * « Nos événements » (expérience Organizer) : point d'entrée unique regroupant la soumission
 * (documents, texte, URL, fichiers structurés, création manuelle), le suivi des imports en cours
 * d'analyse, la validation des brouillons issus de l'import et la gestion des événements de
 * l'organisation. Les événements créés ici sont rattachés à l'organisation active (FSPEC.22).
 *
 * Vue **partagée d'équipe** (FSPEC.22) : tous les agents de l'organisation voient les mêmes
 * soumissions, brouillons et événements — chacun porte le **pseudo de son auteur** pour savoir s'il
 * est opportun d'agir sur celui d'un collègue (absence, départ…). Le tableau des événements est
 * **paginé côté serveur** (une organisation active peut accumuler beaucoup d'événements).
 */
@Component({
  selector: 'app-our-events',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, EventFormComponent, FileDropComponent, IconComponent],
  templateUrl: './our-events.component.html',
  styleUrl: './our-events.component.css',
})
export class OurEventsComponent implements OnInit {
  private readonly imports = inject(ImportsApi);
  private readonly candidates = inject(EventCandidatesApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitOpen = signal(false);
  readonly tab = signal<SubmitTab>('document');
  /** Soumissions en cours d'analyse de l'organisation (filtrées côté serveur). */
  readonly inAnalysis = signal<ImportResponse[]>([]);
  readonly drafts = signal<EventCandidateDto[]>([]);
  readonly events = signal<EventDto[]>([]);
  readonly total = signal(0);
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

  // Tri + pagination du tableau (côté serveur).
  readonly sortKey = signal<SortKey>('startsAt');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(0);
  readonly pageSize = 10;
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  /** Affichage au choix de l'utilisateur : cartes illustrées ou tableau (préférence persistée). */
  private static readonly VIEW_KEY = 'ef-org-events-view';
  readonly view = signal<'cards' | 'table'>(OurEventsComponent.readView());

  private static readView(): 'cards' | 'table' {
    try {
      return localStorage.getItem(OurEventsComponent.VIEW_KEY) === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  }

  setView(view: 'cards' | 'table'): void {
    this.view.set(view);
    try {
      localStorage.setItem(OurEventsComponent.VIEW_KEY, view);
    } catch {
      /* stockage indisponible : la préférence reste en mémoire pour la session. */
    }
  }

  ngOnInit(): void {
    this.refresh();
    // Duplication demandée depuis une autre vue (fiche d'événement) : `?duplicate=<id>`.
    const sourceId = this.route.snapshot.queryParamMap.get('duplicate');
    if (sourceId) {
      this.runDuplicate(sourceId);
    }
  }

  /**
   * Duplique un événement : la copie est **créée immédiatement** (nouvel identifiant, brouillon),
   * puis sa correction s'ouvre. L'original reste intact.
   */
  duplicate(event: EventDto): void {
    this.runDuplicate(event.id);
  }

  private runDuplicate(id: string): void {
    this.busyRow.set(id);
    this.error.set('');
    this.eventsApi.duplicate(id).subscribe({
      next: (copy) => {
        this.busyRow.set(null);
        void this.router.navigate(['/events', copy.id, 'edit']);
      },
      error: (err: unknown) => {
        this.busyRow.set(null);
        this.error.set('La duplication a échoué.');
        this.toast.fromHttp('Duplication impossible', err);
      },
    });
  }

  /** Un événement se corrige directement tant qu'il est brouillon ou soumis (règle de publication). */
  private isDirectlyEditable(event: EventDto): boolean {
    return event.status === 'DRAFT' || event.status === 'SUBMITTED';
  }

  /** Infobulle du bouton « Modifier » : annonce la dépublication quand elle est nécessaire. */
  editTitle(event: EventDto): string {
    return this.isDirectlyEditable(event)
      ? "Corriger l'événement"
      : "Un événement publié doit être dépublié pour être modifié, puis republié";
  }

  /**
   * Ouvre la correction d'un événement (ORG-002 « modifier »). Un événement **publié** n'est pas
   * modifiable en l'état : sur confirmation explicite, il est d'abord **dépublié** (→ brouillon,
   * transition journalisée) avant d'ouvrir le formulaire ; il pourra être republié ensuite.
   */
  editEvent(event: EventDto): void {
    if (this.isDirectlyEditable(event)) {
      void this.router.navigate(['/events', event.id, 'edit']);
      return;
    }
    const confirmed = confirm(
      `« ${event.title} » est publié : il sera dépublié pour permettre la modification, ` +
        'puis vous pourrez le republier. Continuer ?',
    );
    if (!confirmed) {
      return;
    }
    this.busyRow.set(event.id);
    this.error.set('');
    this.eventsApi.unpublish(event.id).subscribe({
      next: () => {
        this.busyRow.set(null);
        void this.router.navigate(['/events', event.id, 'edit']);
      },
      error: (err: unknown) => {
        this.busyRow.set(null);
        this.error.set('La dépublication a échoué.');
        this.toast.fromHttp('Dépublication impossible', err);
      },
    });
  }

  /** Recharge les trois inventaires partagés de l'organisation (soumissions, brouillons, événements). */
  refresh(): void {
    this.imports.listOrganization().subscribe({ next: (list) => this.inAnalysis.set(list) });
    this.candidates.listOrganization('PENDING').subscribe({ next: (list) => this.drafts.set(list) });
    this.loadEvents();
  }

  /** Charge une page du tableau des événements (pagination + tri côté serveur — FSPEC.04/22). */
  private loadEvents(): void {
    this.loading.set(true);
    this.eventsApi
      .search({
        organizationScope: 'true',
        skip: String(this.page() * this.pageSize),
        take: String(this.pageSize),
        sortBy: this.sortKey(),
        sortDir: this.sortDir(),
      })
      .subscribe({
        next: (result) => {
          this.events.set(result.items);
          this.total.set(result.total);
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
        this.toast.success('Soumission envoyée', "L'analyse est en cours ; le brouillon apparaîtra ici.");
        this.refresh();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set('La soumission a échoué.');
        this.toast.fromHttp('Soumission refusée', err);
      },
    });
  }

  onCreate(input: CreateEventInput): void {
    this.createBusy.set(true);
    this.createMsg.set('');
    this.eventsApi.create(input).subscribe({
      next: () => {
        this.createBusy.set(false);
        this.createMsg.set('✅ Événement créé (brouillon).');
        this.toast.success('Événement créé', 'Il est en brouillon : publiez-le quand il est prêt.');
        this.refresh();
      },
      error: (err: unknown) => {
        this.createBusy.set(false);
        this.createMsg.set((err as { error?: { message?: string } })?.error?.message ?? 'La création a échoué.');
        // Le formulaire est long : le message posé au-dessus est hors écran au moment du clic.
        this.toast.fromHttp('Création refusée', err);
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
        this.message.set('Événement validé.');
        this.toast.success('Brouillon validé', "L'événement rejoint « Nos événements ».");
        this.refresh();
      },
      error: (err: { error?: { code?: string; message?: string } }) => {
        this.busy.set(false);
        if (err?.error?.code === 'SUBMISSION_HELD_FOR_REVIEW') {
          // Retenue pour revue : l'encadré explicatif reste, le toast signale que rien n'a été créé.
          const reason = err.error.message ?? 'Validation retenue pour vérification.';
          this.holdNotice.set(reason);
          this.toast.info('Validation retenue pour vérification', reason);
        } else {
          this.error.set('La validation a échoué.');
          this.toast.fromHttp('Validation refusée', err);
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

  // --- Tableau des événements ---

  date(e: EventDto): string {
    return formatDateTime(e.startsAt);
  }

  categoryOf(e: EventDto): string {
    return e.subjects?.length ? e.subjects.join(', ') : '—';
  }

  isPublished(e: EventDto): boolean {
    return e.status === 'PUBLISHED';
  }

  /** Libellé de statut de publication affiché sur la couverture (vue cartes). */
  pubStatus(e: EventDto): string {
    if (e.status === 'ARCHIVED') return 'Archivé';
    return this.isPublished(e) ? 'Publié' : 'Brouillon';
  }

  /** Fond de la couverture — logique partagée (image de couverture, sinon dégradé festif). */
  coverBg(e: EventDto): string {
    return eventCoverBackground(e);
  }

  /** Change la colonne / le sens de tri puis recharge la première page (tri côté serveur). */
  sort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(0);
    this.loadEvents();
  }

  /** Change la colonne de tri via le sélecteur (vue cartes). */
  setSort(key: SortKey): void {
    this.sortKey.set(key);
    this.page.set(0);
    this.loadEvents();
  }

  /** Inverse le sens de tri (vue cartes). */
  toggleDir(): void {
    this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    this.page.set(0);
    this.loadEvents();
  }

  arrow(key: SortKey): string {
    return this.sortKey() === key ? (this.sortDir() === 'asc' ? '▲' : '▼') : '';
  }

  goTo(page: number): void {
    this.page.set(page);
    this.loadEvents();
  }

  /** Bascule la publication : publie un événement non publié, dépublie un événement publié. */
  togglePublish(e: EventDto): void {
    this.busyRow.set(e.id);
    this.error.set('');
    const call = this.isPublished(e) ? this.eventsApi.unpublish(e.id) : this.eventsApi.publish(e.id);
    call.subscribe({
      next: (updated) => {
        this.applyRowUpdate(updated);
        this.busyRow.set(null);
      },
      error: (err: unknown) => {
        this.busyRow.set(null);
        this.error.set("L'action a échoué.");
        this.toast.fromHttp('Publication impossible', err);
      },
    });
  }

  rowAction(e: EventDto, action: 'archive' | 'restore'): void {
    this.error.set('');
    const call = action === 'archive' ? this.eventsApi.archive(e.id) : this.eventsApi.restore(e.id);
    call.subscribe({
      next: (updated) => this.applyRowUpdate(updated),
      error: (err: unknown) => {
        this.error.set("L'action a échoué.");
        this.toast.fromHttp("L'action a échoué", err);
      },
    });
  }

  /**
   * Reporte la mise à jour d'une ligne. Le tri par statut peut déplacer l'événement hors de la page
   * courante : dans ce cas on recharge la page pour rester cohérent avec la pagination serveur.
   */
  private applyRowUpdate(updated: EventDto): void {
    if (this.sortKey() === 'status') {
      this.loadEvents();
      return;
    }
    this.events.update((list) => list.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
  }
}

function toDraft(payload: Record<string, unknown>): EventDraft {
  const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
  const num = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
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
