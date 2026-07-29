import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EventCandidatesApi } from '../../core/api/event-candidates.service';
import { ImportsApi } from '../../core/api/imports.service';
import { EventsApi } from '../../core/api/events.service';
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
  styles: [
    `
      .intro { color: var(--muted); margin: 0 0 1rem; }
      .grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
      .card { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 1rem 1.1rem; }
      .box-head { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; }
      .box-head h2 { margin: 0; }
      .tabs { display: flex; flex-wrap: wrap; gap: 0.3rem; background: var(--surface-2); border-radius: 12px; padding: 0.25rem; width: fit-content; margin-bottom: 0.8rem; }
      .tabs button { border: 0; background: transparent; color: var(--muted); border-radius: 9px; padding: 0.4rem 0.9rem; font-weight: 600; }
      .tabs button.on { background: var(--organizer); color: #fff; }
      textarea, input[type='url'] { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 0.55rem 0.7rem; font: inherit; background: var(--bg); color: var(--text); }
      textarea { min-height: 8rem; resize: vertical; }
      .row { display: flex; gap: 0.6rem; align-items: center; margin-top: 0.6rem; flex-wrap: wrap; }
      .ai { display: flex; gap: 0.45rem; align-items: center; font-size: 0.85rem; margin: 0.4rem 0; }
      .disclaimer { background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.82rem; margin: 0.5rem 0; }
      .sub { display: flex; justify-content: space-between; gap: 0.6rem; border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; align-items: center; }
      .badge { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; background: var(--surface-2); }
      .badge.running { color: #b45309; background: rgba(234, 179, 8, 0.15); }
      .who { font-size: 0.78rem; color: var(--muted); }
      .who strong { color: var(--text); font-weight: 600; }
      .draft-item { border: 1px solid var(--border); border-radius: 10px; padding: 0.5rem 0.75rem; margin-bottom: 0.4rem; cursor: pointer; }
      .draft-item.on { border-color: var(--organizer); box-shadow: 0 0 0 1px var(--organizer); }
      .muted { color: var(--muted); }
      .ok { background: rgba(22, 163, 74, 0.12); border: 1px solid rgba(22, 163, 74, 0.4); border-radius: 10px; padding: 0.6rem 0.9rem; margin-bottom: 0.8rem; }
      .hold { background: rgba(234, 179, 8, 0.14); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px; padding: 0.6rem 0.9rem; }
      .err { color: var(--red); }
      h2 { font-size: 1rem; margin: 0 0 0.6rem; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
      th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      th .arr { color: var(--organizer); }
      .pager { display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-top: 0.6rem; }
      .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
      .switch input { display: none; }
      .slider { position: absolute; inset: 0; background: var(--border); border-radius: 999px; transition: 0.2s; cursor: pointer; }
      .slider::before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
      .switch input:checked + .slider { background: var(--green, #2e7d32); }
      .switch input:checked + .slider::before { transform: translateX(18px); }
      .switch input:disabled + .slider { opacity: 0.45; cursor: not-allowed; }

      /* En-tête de la liste : titre + sélecteur de vue (cartes / tableau). */
      .events-head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.6rem; }
      .events-head h2 { margin: 0; }
      .view-toggle { display: inline-flex; background: var(--surface-2); border-radius: 10px; padding: 0.2rem; gap: 0.15rem; }
      .view-toggle button { border: 0; background: transparent; color: var(--muted); border-radius: 8px; padding: 0.3rem 0.6rem; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem; }
      .view-toggle button.on { background: var(--organizer); color: #fff; }
      .sort-bar { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; color: var(--muted); font-size: 0.85rem; }
      .sort-bar select { border: 1px solid var(--border); border-radius: 8px; padding: 0.35rem 0.55rem; font: inherit; background: var(--surface); color: var(--text); }
      .sort-bar .dir { border: 1px solid var(--border); background: var(--surface); border-radius: 8px; padding: 0.3rem 0.55rem; cursor: pointer; }

      /* Vue « cartes de gestion » : couverture illustrée + contrôles conservés. */
      .mgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.1rem; }
      .mcard { display: flex; flex-direction: column; border-radius: 14px; overflow: hidden; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm); transition: transform 0.18s ease, box-shadow 0.18s ease; }
      .mcard:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
      .mcard.archived { opacity: 0.72; }
      .mcard .cover { position: relative; height: 130px; background-size: cover; background-position: center; }
      .mcard .cover .chip { position: absolute; top: 0.55rem; left: 0.55rem; font-size: 0.7rem; font-weight: 700; color: #fff; padding: 0.12rem 0.55rem; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(4px); }
      .mcard .cover .status { position: absolute; top: 0.55rem; right: 0.55rem; font-size: 0.66rem; font-weight: 800; padding: 0.12rem 0.5rem; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; }
      .status.pub { background: rgba(22, 163, 74, 0.92); color: #fff; }
      .status.draft { background: rgba(255, 255, 255, 0.9); color: #1f2333; }
      .status.arch { background: rgba(220, 38, 38, 0.9); color: #fff; }
      .mcard .mbody { padding: 0.7rem 0.85rem; display: grid; gap: 0.22rem; flex: 1; }
      .mcard .mtitle { font-weight: 700; }
      .mcard .mtitle a { color: inherit; }
      .mcard .mtitle a:hover { color: var(--organizer); }
      .mcard .mmeta { font-size: 0.8rem; color: var(--muted); }
      .mfoot { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.55rem 0.85rem; border-top: 1px solid var(--border); background: var(--surface-2); }
      .pub-toggle { display: flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; font-weight: 600; color: var(--muted); }
      .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
    `,
  ],
  template: `
    <h1>Nos événements</h1>
    <p class="intro">
      Soumettez (document, texte, URL, fichier structuré) ou créez un événement, suivez les analyses en
      cours, validez les brouillons, et gérez le cycle de publication — au nom de votre organisation.
      Toute l'équipe partage la même vue : le créateur de chaque élément est indiqué.
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
            <app-event-form submitLabel="Créer l'événement" [busy]="createBusy()" (save)="onCreate($event)" />
            @if (createMsg()) { <p class="muted" style="margin:0.4rem 0 0">{{ createMsg() }}</p> }
          }
          @if (error()) { <p class="err">{{ error() }}</p> }
        }
      </section>

      <!-- Soumissions en cours d'analyse (de toute l'organisation) -->
      @if (inAnalysis().length) {
        <section class="card">
          <h2>Soumissions <span class="muted">(analyse en cours)</span></h2>
          @for (s of inAnalysis(); track s.id) {
            <div class="sub">
              <span>
                {{ s.type }} · {{ s.createdAt | date: 'short' }}
                @if (s.createdByName) { <span class="who">— par <strong>{{ s.createdByName }}</strong></span> }
              </span>
              <span class="badge running">{{ statusLabel(s.status) }}</span>
            </div>
          }
        </section>
      }

      <!-- Validation des brouillons issus de l'import (de toute l'organisation) -->
      @if (drafts().length || selected()) {
        <section class="card">
          <h2>Validation <span class="muted">(brouillons à qualifier)</span></h2>
          @for (d of drafts(); track d.id) {
            <div class="draft-item" [class.on]="selected()?.id === d.id" (click)="select(d)">
              <strong>{{ draftTitle(d) }}</strong>
              <span class="muted"> · {{ d.createdAt | date: 'short' }}</span>
              @if (d.createdByName) { <span class="who"> — par <strong>{{ d.createdByName }}</strong></span> }
            </div>
          }
          @if (holdNotice()) { <p class="hold">⏸️ {{ holdNotice() }}</p> }
          @if (selected(); as sel) {
            <div style="margin-top:0.8rem">
              <h2>Qualifier ce brouillon</h2>
              <app-event-form [draft]="draft()" submitLabel="Valider l'événement" [showReject]="true"
                [busy]="busy()" (save)="validate($event)" (reject)="reject(sel.id)" />
            </div>
          }
        </section>
      }

      <!-- Événements de l'organisation (paginés côté serveur) — vue au choix : cartes ou tableau. -->
      <section class="card">
        <div class="events-head">
          <h2>Nos événements</h2>
          <div class="view-toggle" role="tablist" aria-label="Affichage de la liste">
            <button type="button" [class.on]="view() === 'cards'" (click)="setView('cards')" aria-label="Vue cartes">▦ Cartes</button>
            <button type="button" [class.on]="view() === 'table'" (click)="setView('table')" aria-label="Vue tableau">▤ Tableau</button>
          </div>
        </div>

        @if (loading()) {
          <p class="muted">Chargement…</p>
        } @else if (!events().length) {
          <p class="muted">Aucun événement pour l'instant.</p>
        } @else {
          @if (view() === 'cards') {
            <!-- Tri (les en-têtes cliquables du tableau n'existent pas en vue cartes). -->
            <div class="sort-bar">
              <span>Trier</span>
              <select [ngModel]="sortKey()" (ngModelChange)="setSort($event)">
                <option value="startsAt">Date de début</option>
                <option value="title">Titre</option>
                <option value="status">Publication</option>
              </select>
              <button class="dir" type="button" (click)="toggleDir()" [title]="sortDir() === 'asc' ? 'Croissant' : 'Décroissant'">
                {{ sortDir() === 'asc' ? '▲' : '▼' }}
              </button>
            </div>
            <div class="mgrid">
              @for (e of events(); track e.id) {
                <article class="mcard" [class.archived]="e.status === 'ARCHIVED'">
                  <div class="cover" [style.background]="coverBg(e)">
                    <span class="chip">{{ e.activity }}</span>
                    <span class="status" [class.pub]="isPublished(e)" [class.arch]="e.status === 'ARCHIVED'"
                      [class.draft]="!isPublished(e) && e.status !== 'ARCHIVED'">{{ pubStatus(e) }}</span>
                  </div>
                  <div class="mbody">
                    <span class="mtitle"><a [routerLink]="['/events', e.id]">{{ e.title }}</a></span>
                    <span class="mmeta">{{ date(e) }}</span>
                    <span class="mmeta">{{ categoryOf(e) }}</span>
                    <span class="who">par <strong>{{ e.createdByName || '—' }}</strong></span>
                  </div>
                  <div class="mfoot">
                    <label class="pub-toggle" [title]="e.status === 'ARCHIVED' ? 'Restaurez d’abord l’événement' : (isPublished(e) ? 'Publié' : 'Non publié')">
                      <span class="switch">
                        <input type="checkbox" [checked]="isPublished(e)" [disabled]="e.status === 'ARCHIVED' || busyRow() === e.id"
                          (change)="togglePublish(e)" />
                        <span class="slider"></span>
                      </span>
                      {{ isPublished(e) ? 'Publié' : (e.status === 'ARCHIVED' ? 'Archivé' : 'Non publié') }}
                    </label>
                    <span style="display:flex;gap:0.4rem;flex-wrap:wrap">
                      @if (e.status !== 'ARCHIVED') {
                        <button class="btn btn-sm btn-icon" [disabled]="busyRow() === e.id"
                          [title]="editTitle(e)" [attr.aria-label]="editTitle(e)" (click)="editEvent(e)">
                          <app-icon name="edit" />
                        </button>
                      }
                      <button class="btn btn-sm btn-icon" title="Dupliquer — créer un événement identique"
                        aria-label="Dupliquer — créer un événement identique" (click)="duplicate(e)">
                        <app-icon name="duplicate" />
                      </button>
                      @if (e.status === 'ARCHIVED') {
                        <button class="btn btn-sm btn-icon" title="Restaurer" aria-label="Restaurer"
                          (click)="rowAction(e, 'restore')">
                          <app-icon name="restore" />
                        </button>
                      } @else {
                        <button class="btn btn-sm btn-icon" title="Archiver" aria-label="Archiver"
                          (click)="rowAction(e, 'archive')">
                          <app-icon name="archive" />
                        </button>
                      }
                    </span>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div style="overflow-x:auto">
              <table>
                <thead>
                  <tr>
                    <th class="sortable" (click)="sort('startsAt')">Date début <span class="arr">{{ arrow('startsAt') }}</span></th>
                    <th class="sortable" (click)="sort('title')">Titre <span class="arr">{{ arrow('title') }}</span></th>
                    <th>Sujets</th>
                    <th>Créateur</th>
                    <th class="sortable" (click)="sort('status')">Publication <span class="arr">{{ arrow('status') }}</span></th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (e of events(); track e.id) {
                    <tr>
                      <td>{{ date(e) }}</td>
                      <td><a [routerLink]="['/events', e.id]">{{ e.title }}</a></td>
                      <td>{{ categoryOf(e) }}</td>
                      <td>{{ e.createdByName || '—' }}</td>
                      <td>
                        <label class="switch" [title]="e.status === 'ARCHIVED' ? 'Restaurez d’abord l’événement' : (isPublished(e) ? 'Publié' : 'Non publié')">
                          <input type="checkbox" [checked]="isPublished(e)" [disabled]="e.status === 'ARCHIVED' || busyRow() === e.id"
                            (change)="togglePublish(e)" />
                          <span class="slider"></span>
                        </label>
                      </td>
                      <td>
                        <span style="display:flex;gap:0.4rem;flex-wrap:wrap">
                          @if (e.status !== 'ARCHIVED') {
                            <button class="btn btn-sm btn-icon" [disabled]="busyRow() === e.id"
                              [title]="editTitle(e)" [attr.aria-label]="editTitle(e)" (click)="editEvent(e)">
                              <app-icon name="edit" />
                            </button>
                          }
                          <button class="btn btn-sm btn-icon" title="Dupliquer — créer un événement identique"
                            aria-label="Dupliquer — créer un événement identique" (click)="duplicate(e)">
                            <app-icon name="duplicate" />
                          </button>
                          @if (e.status === 'ARCHIVED') {
                            <button class="btn btn-sm btn-icon" title="Restaurer" aria-label="Restaurer"
                              (click)="rowAction(e, 'restore')">
                              <app-icon name="restore" />
                            </button>
                          } @else {
                            <button class="btn btn-sm btn-icon" title="Archiver" aria-label="Archiver"
                              (click)="rowAction(e, 'archive')">
                              <app-icon name="archive" />
                            </button>
                          }
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="pager">
            <span class="muted">{{ total() }} événement(s) · page {{ page() + 1 }}/{{ pageCount() }}</span>
            <button class="btn btn-sm" [disabled]="page() === 0" (click)="goTo(page() - 1)">‹</button>
            <button class="btn btn-sm" [disabled]="page() >= pageCount() - 1" (click)="goTo(page() + 1)">›</button>
          </div>
        }
        @if (error()) { <p class="err">{{ error() }}</p> }
      </section>
    </div>
  `,
})
export class OurEventsComponent implements OnInit {
  private readonly imports = inject(ImportsApi);
  private readonly candidates = inject(EventCandidatesApi);
  private readonly eventsApi = inject(EventsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  /** Dégradés festifs (déclinés de la marque) pour la couverture d'un événement sans image. */
  private static readonly PLACEHOLDERS = [
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #6366f1, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
  ];

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
      error: (err: { error?: { message?: string } }) => {
        this.busyRow.set(null);
        this.error.set(err?.error?.message ?? 'La duplication a échoué.');
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
      error: (err: { error?: { message?: string } }) => {
        this.busyRow.set(null);
        this.error.set(err?.error?.message ?? 'La dépublication a échoué.');
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
    this.eventsApi.create(input).subscribe({
      next: () => {
        this.createBusy.set(false);
        this.createMsg.set('✅ Événement créé (brouillon).');
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
        this.message.set('Événement validé.');
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

  /** Fond de la couverture (vue cartes) : 1ʳᵉ image de l'événement, sinon dégradé festif déterministe. */
  coverBg(e: EventDto): string {
    const image = e.media?.find((m) => m.contentType?.startsWith('image/')) ?? e.media?.[0];
    if (image) {
      return `center / cover no-repeat url("${image.url}")`;
    }
    let hash = 0;
    for (const ch of e.id) hash = (hash + ch.charCodeAt(0)) | 0;
    const list = OurEventsComponent.PLACEHOLDERS;
    return list[Math.abs(hash) % list.length];
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
      error: (err: { error?: { message?: string } }) => {
        this.busyRow.set(null);
        this.error.set(err?.error?.message ?? "L'action a échoué.");
      },
    });
  }

  rowAction(e: EventDto, action: 'archive' | 'restore'): void {
    this.error.set('');
    const call = action === 'archive' ? this.eventsApi.archive(e.id) : this.eventsApi.restore(e.id);
    call.subscribe({
      next: (updated) => this.applyRowUpdate(updated),
      error: (err: { error?: { message?: string } }) => this.error.set(err?.error?.message ?? "L'action a échoué."),
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
