import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EventCandidatesApi } from '../../core/api/event-candidates.service';
import { ImportsApi } from '../../core/api/imports.service';
import {
  CreateEventInput,
  EventCandidateDetailDto,
  EventCandidateDto,
  EventDraft,
  EventDto,
  EventEditValue,
  ImportResponse,
} from '../../core/models';
import { EventsApi } from '../../core/api/events.service';
import { ToastService } from '../../core/toast.service';
import { EventFormComponent } from '../../shared/event-form.component';
import { FileDropComponent } from '../../shared/file-drop.component';
import { DataColumn, DataTableComponent } from '../../shared/data-table.component';
import { formatDateTime } from '../../shared/date-format';
import { IconComponent } from '../../shared/icon.component';
import { eventCoverBackground } from '../../shared/event-cover';

type SubmitTab = 'document' | 'text' | 'url' | 'structured' | 'create';
/** Colonnes de tri proposées en vue cartes (la vue tableau trie par en-tête). */
type PrivateSortKey = 'startsAt' | 'title' | 'status';

/**
 * Entonnoir de soumission Explorer (FSPEC.22 §5-6, §15) — homogénéisé avec l'expérience Organizer.
 * Une **seule** entrée « Mes événements privés » regroupe la soumission (box « Nouvelle soumission »
 * repliable, mêmes onglets : Documents, Texte, URL, Fichiers structurés, Création), le suivi des
 * soumissions en cours d'analyse, la validation des brouillons, et la liste des événements privés —
 * en **cartes ou en tableau**, au choix de l'utilisateur (préférence mémorisée localement), comme
 * dans « Nos événements ». Après validation, chaque brouillon devient un **événement
 * privé** (visible du seul créateur, jamais publié — ESUB-009) qui apparaît **ici**, jamais dans
 * l'expérience Organizer. Le scoping par créateur est appliqué côté API.
 */
@Component({
  selector: 'app-submit-event',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, EventFormComponent, FileDropComponent, DataTableComponent, IconComponent],
  templateUrl: './submit-event.component.html',
  styleUrl: './submit-event.component.css',
})
export class SubmitEventComponent implements OnInit {
  private readonly imports = inject(ImportsApi);
  private readonly candidates = inject(EventCandidatesApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

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

  /**
   * Formulaire de **correction** d'un événement privé existant (`editingId`) : le formulaire de
   * création est prérempli à partir de l'événement, et l'enregistrement met à jour celui-ci.
   * Une duplication passe par ce même chemin, la copie étant d'abord créée côté serveur.
   */
  readonly formSource = signal<EventEditValue | null>(null);
  readonly formPending = signal(false);
  readonly editingId = signal<string | null>(null);

  /** Valeurs injectées dans le formulaire (telles quelles : le titre de copie vient du serveur). */
  readonly formInitial = computed<EventEditValue | null>(() => this.formSource());

  file: File | null = null;
  fileUseAi = false;
  text = '';
  useAi = false;
  url = '';
  structured = '';

  /** Soumissions encore en cours d'analyse (ni terminées, ni en échec, ni prêtes à valider). */
  readonly inAnalysis = computed(() =>
    this.submissions().filter((s) => !['COMPLETED', 'FAILED', 'READY_FOR_VALIDATION'].includes(s.status)),
  );

  // --- Affichage de la liste : cartes ou tableau, au choix de l'utilisateur ---

  private static readonly VIEW_KEY = 'ef-private-events-view';
  readonly view = signal<'cards' | 'table'>(SubmitEventComponent.readView());
  readonly sortKey = signal<PrivateSortKey>('startsAt');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  private static readView(): 'cards' | 'table' {
    try {
      return localStorage.getItem(SubmitEventComponent.VIEW_KEY) === 'cards' ? 'cards' : 'table';
    } catch {
      return 'table';
    }
  }

  setView(view: 'cards' | 'table'): void {
    this.view.set(view);
    try {
      localStorage.setItem(SubmitEventComponent.VIEW_KEY, view);
    } catch {
      /* stockage indisponible : la préférence reste en mémoire pour la session. */
    }
  }

  toggleDir(): void {
    this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
  }

  /**
   * Tri de la vue cartes. La liste des événements privés est chargée en entier côté client (elle
   * est propre à un seul utilisateur) : le tri se fait donc en mémoire, comme celui d'`app-data-table`
   * en vue tableau.
   */
  readonly sortedEvents = computed(() => {
    const key = this.sortKey();
    const factor = this.sortDir() === 'asc' ? 1 : -1;
    return [...this.events()].sort((a, b) => {
      const left = key === 'startsAt' ? a.startsAt : key === 'title' ? a.title : a.status;
      const right = key === 'startsAt' ? b.startsAt : key === 'title' ? b.title : b.status;
      return String(left ?? '').localeCompare(String(right ?? ''), 'fr') * factor;
    });
  });

  /** Libellé de statut affiché sur la couverture. Un événement privé n'est jamais « publié ». */
  pubStatus(e: EventDto): string {
    return e.status === 'ARCHIVED' ? 'Archivé' : 'Brouillon';
  }

  /** Fond de la couverture — logique partagée (image de couverture, sinon dégradé festif). */
  coverBg(e: EventDto): string {
    return eventCoverBackground(e);
  }

  // Colonnes du tableau « Mes événements » (tri/recherche/pagination via app-data-table).
  readonly privateColumns: DataColumn[] = [
    {
      key: 'startsAt',
      label: 'Date début',
      sortable: true,
      value: (r) => this.date(r as unknown as EventDto),
      sortValue: (r) => String(r['startsAt'] ?? ''),
    },
    { key: 'title', label: 'Titre', sortable: true, value: (r) => String(r['title'] ?? '') },
    { key: 'subjects', label: 'Sujets', sortable: true, value: (r) => this.categoryOf(r as unknown as EventDto) },
  ];

  ngOnInit(): void {
    this.refresh();
    // Actions demandées depuis une autre vue (fiche d'événement) : correction ou duplication.
    const params = this.route.snapshot.queryParamMap;
    const editId = params.get('edit');
    const duplicateId = params.get('duplicate');
    if (editId) {
      this.loadForEdit(editId);
    } else if (duplicateId) {
      this.runDuplicate(duplicateId);
    }
  }

  /**
   * Duplique un événement : la copie privée est **créée immédiatement** (nouvel identifiant,
   * brouillon), puis sa correction s'ouvre. L'original reste intact.
   */
  duplicate(event: EventDto): void {
    this.runDuplicate(event.id);
  }

  private runDuplicate(sourceId: string): void {
    this.createMsg.set('');
    this.error.set('');
    this.busyRow.set(sourceId);
    this.eventsApi.duplicateAsPrivate(sourceId).subscribe({
      next: (copy) => {
        this.busyRow.set(null);
        this.message.set('Copie créée : ajustez-la puis enregistrez.');
        this.toast.success('Copie créée', 'Ajustez-la puis enregistrez.');
        this.refresh();
        this.loadForEdit(copy.id);
      },
      error: (err: unknown) => {
        this.busyRow.set(null);
        this.error.set('La duplication a échoué.');
        this.toast.fromHttp('Duplication impossible', err);
      },
    });
  }

  /** Ouvre la correction d'un de mes événements privés (formulaire prérempli, mise à jour à l'envoi). */
  editPrivate(event: EventDto): void {
    this.loadForEdit(event.id);
  }

  /** Repart d'un formulaire vierge (abandon de la modification en cours). */
  cancelForm(): void {
    this.formSource.set(null);
    this.editingId.set(null);
    this.createMsg.set('');
  }

  /**
   * Charge un événement privé dans le formulaire pour correction. Le formulaire n'est rendu qu'une
   * fois la source chargée : son préremplissage a lieu à l'initialisation du composant et ne peut
   * pas être appliqué après coup.
   */
  private loadForEdit(id: string): void {
    this.submitOpen.set(true);
    this.tab.set('create');
    this.createMsg.set('');
    this.formSource.set(null);
    this.editingId.set(id);
    this.formPending.set(true);
    this.eventsApi.getPrivateForEdit(id).subscribe({
      next: (source) => {
        this.formSource.set(source);
        this.formPending.set(false);
      },
      error: (err: unknown) => {
        this.formPending.set(false);
        this.editingId.set(null);
        this.error.set("L'événement est introuvable.");
        this.toast.fromHttp('Ouverture impossible', err, "L'événement est introuvable.");
      },
    });
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

  /**
   * Enregistre le formulaire : **mise à jour** de l'événement en cours de modification, sinon
   * **création** d'un nouvel événement privé (saisie directe ou duplication).
   */
  onSaveEvent(input: CreateEventInput): void {
    const editingId = this.editingId();
    this.createBusy.set(true);
    this.createMsg.set('');
    const request = editingId
      ? this.eventsApi.updatePrivate(editingId, input)
      : this.eventsApi.createPrivate(input);
    request.subscribe({
      next: () => {
        this.createBusy.set(false);
        this.createMsg.set(
          editingId ? '✅ Modifications enregistrées.' : '✅ Événement privé créé.',
        );
        this.message.set(editingId ? 'Événement privé mis à jour.' : 'Événement privé créé.');
        this.toast.success(
          editingId ? 'Modifications enregistrées' : 'Événement privé créé',
          editingId ? undefined : 'Il apparaît dans « Mes événements ».',
        );
        // L'intention est consommée : le formulaire repart vierge pour la saisie suivante.
        this.formSource.set(null);
        this.editingId.set(null);
        this.refresh();
      },
      error: (err: unknown) => {
        this.createBusy.set(false);
        const message = (err as { error?: { message?: string } })?.error?.message;
        this.createMsg.set(
          message ?? (editingId ? "L'enregistrement a échoué." : 'La création a échoué.'),
        );
        // Le formulaire est long : le message posé au-dessus est hors écran au moment du clic.
        this.toast.fromHttp(editingId ? 'Enregistrement refusé' : 'Création refusée', err);
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
        this.toast.success('Brouillon validé', 'Il devient un événement privé.');
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
      error: (err: unknown) => {
        this.busy.set(false);
        this.toast.fromHttp('Rejet impossible', err);
      },
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

  openEvent(row: Record<string, unknown>): void {
    this.openEventById(String(row['id']));
  }

  openEventById(id: string): void {
    void this.router.navigate(['/events', id]);
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
      error: (err: unknown) => {
        this.busyRow.set(null);
        this.error.set("L'action a échoué.");
        this.toast.fromHttp("L'action a échoué", err);
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
