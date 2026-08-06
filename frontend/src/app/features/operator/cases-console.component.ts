import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CaseCatalog,
  CaseDashboard,
  CaseDetail,
  CaseSummary,
  CasesApi,
  REFERENCE_KIND_LABELS,
  ReferenceKind,
  ReferenceSuggestion,
  RoutingRule,
} from '../../core/api/cases.service';
import { ModerationApi } from '../../core/api/moderation.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ActivityDto, FamilyDto, ReferentialItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';

/**
 * Console Operator du Case Management (FSPEC.21) : file filtrable, tableau de bord opérationnel, et
 * traitement d'une Case (prise en charge, statut, priorité, escalade, commentaires). Les transitions
 * invalides et l'invariant d'affectation sont garantis côté serveur.
 */
@Component({
  selector: 'app-cases-console',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styles: [
    `
      /* Tokens neutres uniquement (UISPEC.13) : surfaces, bordures et textes suivent le thème —
         les valeurs en dur restaient sombres en thème clair, d'où un rendu illisible. */
      .row { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
      .muted { color: var(--muted); font-size: 0.85rem; }
      .kpis { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
      .kpi { background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 0.6rem 1rem; box-shadow: var(--shadow-sm); }
      .kpi b { font-size: 1.4rem; display: block; color: var(--text); }
      table { width: 100%; border-collapse: collapse; }
      th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      th .arr { color: var(--exp); font-size: 0.8em; }
      .pager { display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-top: 0.6rem; }
      th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
      th { color: var(--muted); font-weight: 600; }
      tr.sel { background: var(--exp-weak); }
      .badge { font-size: 0.72rem; padding: 0.05rem 0.5rem; border-radius: 999px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
      .crit { background: rgba(239, 68, 68, 0.16); color: var(--red); border-color: rgba(239, 68, 68, 0.4); }
      .suggestion { margin-top: 0.6rem; border-top: 1px solid var(--border); padding-top: 0.6rem; }
      .entry { font-size: 0.85rem; border-left: 2px solid var(--border); padding-left: 0.6rem; margin-bottom: 0.4rem; }
      textarea.input { min-height: 60px; }
      /* Édition d'une règle de routage : un bloc par critère, valeurs proposées (jamais saisies). */
      .rule-crit { display: grid; gap: 0.35rem; margin-bottom: 0.6rem; }
      .rule-crit-label { font-size: 0.8rem; font-weight: 600; }
      .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .chip { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 999px; padding: 0.2rem 0.65rem; font-size: 0.8rem; cursor: pointer; }
      .chip.on { background: var(--exp); border-color: var(--exp); color: var(--exp-contrast, #fff); }
    `,
  ],
  template: `
    <div class="page">
      <h1>Dossiers (Cases)</h1>

      @if (dash(); as d) {
        <div class="kpis">
          <div class="kpi"><b>{{ d.open }}</b><span class="muted">ouvertes</span></div>
          <div class="kpi"><b>{{ d.critical }}</b><span class="muted">critiques</span></div>
          @for (s of d.byDomain; track s.domain) {
            <div class="kpi"><b>{{ s.count }}</b><span class="muted">{{ label(s.domain) }}</span></div>
          }
        </div>
      }

      <section class="card">
        <div class="row" style="margin-bottom:0.6rem;flex-wrap:wrap">
          <input class="input" [(ngModel)]="fSearch" (keyup.enter)="applyFilter()"
                 placeholder="Rechercher (réf. ou objet)…" style="min-width:200px" />
          <select [(ngModel)]="fStatus" (ngModelChange)="applyFilter()">
            <option value="">Tout statut</option>
            @for (s of catalog()?.statuses ?? []; track s) { <option [value]="s">{{ label(s) }}</option> }
          </select>
          <select [(ngModel)]="fDomain" (ngModelChange)="applyFilter()">
            <option value="">Tout domaine</option>
            @for (dm of catalog()?.domains ?? []; track dm) { <option [value]="dm">{{ label(dm) }}</option> }
          </select>
          <select [(ngModel)]="fPriority" (ngModelChange)="applyFilter()">
            <option value="">Toute priorité</option>
            @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
          </select>
          <label class="muted"><input type="checkbox" [(ngModel)]="fUnassigned" (ngModelChange)="applyFilter()" /> Non affectées</label>
        </div>

        <div style="overflow-x:auto">
          <table>
            <thead><tr>
              <th class="sortable" (click)="sortBy('reference')">Réf. <span class="arr">{{ arrow('reference') }}</span></th>
              <th class="sortable" (click)="sortBy('subject')">Objet <span class="arr">{{ arrow('subject') }}</span></th>
              <th class="sortable" (click)="sortBy('domain')">Domaine <span class="arr">{{ arrow('domain') }}</span></th>
              <th class="sortable" (click)="sortBy('priority')">Priorité <span class="arr">{{ arrow('priority') }}</span></th>
              <th class="sortable" (click)="sortBy('status')">Statut <span class="arr">{{ arrow('status') }}</span></th>
              <th>Assignee</th>
            </tr></thead>
            <tbody>
              @for (c of cases(); track c.id) {
                <tr [class.sel]="detail()?.id === c.id" (click)="select(c)" style="cursor:pointer">
                  <td>{{ c.reference }}</td>
                  <td>{{ c.subject }}</td>
                  <td>{{ label(c.domain) }}</td>
                  <td><span class="badge" [class.crit]="c.priority === 'CRITICAL'">{{ label(c.priority) }}</span></td>
                  <td><span class="badge">{{ label(c.status) }}</span></td>
                  <td>{{ c.assignee?.displayName ?? '—' }}</td>
                </tr>
              } @empty { <tr><td colspan="6" class="muted">Aucune Case.</td></tr> }
            </tbody>
          </table>
        </div>
        <div class="pager">
          <span class="muted">{{ total() }} dossier(s) · page {{ page() + 1 }}/{{ pageCount() }}</span>
          <button class="btn btn-sm" [disabled]="page() === 0" (click)="goToPage(-1)">‹</button>
          <button class="btn btn-sm" [disabled]="page() >= pageCount() - 1" (click)="goToPage(1)">›</button>
        </div>
      </section>

      <section class="card">
        <div class="row" style="justify-content:space-between">
          <h2 style="margin:0">Règles de routage</h2>
          <button class="btn btn-sm" (click)="toggleRules()">{{ showRules() ? 'Masquer' : 'Configurer' }}</button>
        </div>
        @if (showRules()) {
          <p class="muted">Évaluées par ordre croissant ; la première applicable l'emporte. Sinon, repli sur le routage par défaut.</p>
          <table>
            <thead><tr><th>Ordre</th><th>Nom</th><th>Si…</th><th>→ Domaine / priorité</th><th>Active</th><th></th></tr></thead>
            <tbody>
              @for (r of rules(); track r.id) {
                <tr>
                  <td>{{ r.orderIndex }}</td>
                  <td>{{ r.name }}</td>
                  <td class="muted">{{ ruleCriteria(r) }}</td>
                  <td>{{ label(ruleDomain(r)) }}{{ rulePriority(r) ? ' · ' + label(rulePriority(r)) : '' }}</td>
                  <td><input type="checkbox" [checked]="r.isActive !== false" (change)="toggleRuleActive(r, $event)" /></td>
                  <td><button class="btn btn-sm danger" (click)="deleteRule(r)">Suppr.</button></td>
                </tr>
              } @empty { <tr><td colspan="6" class="muted">Aucune règle : routage par défaut appliqué.</td></tr> }
            </tbody>
          </table>

          <h3 style="font-size:0.85rem;margin:0.8rem 0 0.4rem">Nouvelle règle</h3>
          <p class="muted" style="margin:0 0 0.5rem">
            <strong>Critères</strong> — un critère laissé vide n'est pas testé. Les critères renseignés
            doivent <strong>tous</strong> être vrais (ET) ; à l'intérieur d'un critère, <strong>l'une</strong>
            des valeurs cochées suffit (OU).
          </p>
          <div class="row">
            <input class="input" [(ngModel)]="nr.name" placeholder="Nom de la règle" style="width:200px" />
            <label class="muted">Ordre
              <input class="input" type="number" [(ngModel)]="nr.orderIndex" style="width:80px;margin-left:0.3rem" />
            </label>
          </div>

          <div class="rule-crit">
            <span class="rule-crit-label">Types <span class="muted">(l'un de ces types)</span></span>
            <div class="chips">
              @for (t of catalog()?.types ?? []; track t) {
                <button type="button" class="chip" [class.on]="nr.types.includes(t)" (click)="toggleIn(nr.types, t)">
                  {{ label(t) }}
                </button>
              }
            </div>
          </div>

          <div class="rule-crit">
            <span class="rule-crit-label">Origines <span class="muted">(qui a ouvert la demande)</span></span>
            <div class="chips">
              @for (o of catalog()?.origins ?? []; track o) {
                <button type="button" class="chip" [class.on]="nr.origins.includes(o)" (click)="toggleIn(nr.origins, o)">
                  {{ label(o) }}
                </button>
              }
            </div>
          </div>

          <div class="rule-crit">
            <span class="rule-crit-label">Autres conditions</span>
            <div class="row">
              <label class="muted">
                <input type="checkbox" [(ngModel)]="nr.requiresEvent" /> rattachée à un événement
              </label>
              <label class="muted">
                confiance IA &lt;
                <input class="input" type="number" step="0.05" min="0" max="1" [(ngModel)]="nr.aiConfidenceBelow"
                       placeholder="—" style="width:90px;margin-left:0.3rem" />
              </label>
            </div>
          </div>

          <div class="rule-crit">
            <span class="rule-crit-label">Résultat <span class="muted">(destination appliquée si la règle gagne)</span></span>
            <div class="row">
              <select [(ngModel)]="nr.domain">
                <option value="">Domaine…</option>
                @for (dm of catalog()?.domains ?? []; track dm) { <option [value]="dm">{{ label(dm) }}</option> }
              </select>
              <select [(ngModel)]="nr.priority">
                <option value="">Priorité (par défaut du type)</option>
                @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
              </select>
              <button class="btn btn-sm" (click)="addRule()" [disabled]="!nr.name.trim() || !nr.domain">Ajouter</button>
            </div>
          </div>
          @if (ruleMsg()) { <p class="muted">{{ ruleMsg() }}</p> }
        }
      </section>

      @if (detail(); as d) {
        <section class="card">
          <div class="row" style="justify-content:space-between">
            <h2 style="margin:0">{{ d.reference }} — {{ d.subject }}</h2>
            <span class="muted">{{ label(d.domain) }} · {{ d.workQueue }}</span>
          </div>
          <p class="muted">{{ d.description }}</p>

          <div class="row">
            <button class="btn btn-sm" (click)="claim(d)">Prendre en charge</button>
            <span class="badge">État : {{ label(d.status) }}</span>
            <select [ngModel]="d.priority" (ngModelChange)="setPriority(d, $event)">
              @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
            </select>
            <button class="btn btn-sm" (click)="escalate(d)">Escalader</button>
          </div>
          @if (actionMsg()) { <p class="muted" style="margin:0.4rem 0 0">{{ actionMsg() }}</p> }

          <!-- Changement d'état : seulement les transitions possibles + commentaire obligatoire (§11) -->
          <div style="margin-top:0.6rem;border-top:1px solid var(--border);padding-top:0.6rem">
            <h3 style="font-size:0.85rem;margin:0 0 0.4rem">Changer l'état</h3>
            @if (d.allowedTransitions?.length) {
              <div class="row">
                <select [(ngModel)]="newStatus">
                  <option value="">Nouvel état…</option>
                  @for (s of d.allowedTransitions; track s) { <option [value]="s">{{ label(s) }}</option> }
                </select>
              </div>
              <textarea class="input" [(ngModel)]="statusComment" style="margin-top:0.4rem"
                        placeholder="Commentaire obligatoire : motif du changement d'état…"></textarea>
              <div class="row" style="margin-top:0.4rem">
                <button class="btn btn-sm btn-primary" (click)="applyStatus(d)"
                        [disabled]="!newStatus || !statusComment.trim()">Appliquer le changement</button>
              </div>
            } @else {
              <p class="muted" style="margin:0">Aucune transition possible depuis « {{ label(d.status) }} ».</p>
            }
          </div>

          <!-- Re-router (destinataire / routage incorrect) : motif obligatoire -->
          <div style="margin-top:0.6rem;border-top:1px solid var(--border);padding-top:0.6rem">
            <h3 style="font-size:0.85rem;margin:0 0 0.4rem">Re-router (destinataire incorrect)</h3>
            <div class="row">
              <select [(ngModel)]="rerouteDomain">
                <option value="">Nouveau domaine…</option>
                @for (dm of catalog()?.domains ?? []; track dm) { <option [value]="dm">{{ label(dm) }}</option> }
              </select>
            </div>
            <textarea class="input" [(ngModel)]="rerouteComment" style="margin-top:0.4rem"
                      placeholder="Commentaire obligatoire : motif du re-routage…"></textarea>
            <div class="row" style="margin-top:0.4rem">
              <button class="btn btn-sm" (click)="applyReroute(d)"
                      [disabled]="!rerouteDomain || !rerouteComment.trim()">Re-router</button>
            </div>
          </div>

          <!-- Proposition d'ajout au référentiel : accepter (en corrigeant si besoin) ou refuser. -->
          @if (suggestionOf(d); as sg) {
            <div class="suggestion">
              <h3 style="font-size:0.85rem;margin:0 0 0.4rem">Proposition d'ajout au référentiel</h3>
              <p class="muted" style="margin:0 0 0.5rem">
                Proposé : <strong>{{ kindLabel(sg.kind) }}</strong> « {{ sg.label }} »
                @if (sg.context) { <span>· constaté sur « {{ sg.context }} »</span> }
              </p>
              @if (createdReferenceOf(d)) {
                <p class="muted" style="margin:0">✅ Référence déjà créée pour cette demande.</p>
              } @else {
                <p class="muted" style="margin:0 0 0.5rem">
                  Le libellé est <strong>modifiable</strong> avant validation : la proposition est un
                  point de départ, pas un ordre de création. Un refus passe par « Changer l'état »,
                  motif à l'appui.
                </p>
                <div class="row">
                  <input class="input" [(ngModel)]="suggestionName" placeholder="Libellé retenu"
                         style="flex:1;min-width:180px" />
                  @if (parentKindOf(sg.kind) === 'DOMAIN') {
                    <select [(ngModel)]="suggestionParentId">
                      <option value="">Domaine de rattachement…</option>
                      @for (dom of domains(); track dom.id) { <option [value]="dom.id">{{ dom.name }}</option> }
                    </select>
                  }
                  @if (parentKindOf(sg.kind) === 'FAMILY') {
                    <select [(ngModel)]="suggestionParentId">
                      <option value="">Famille de rattachement…</option>
                      @for (f of families(); track f.id) {
                        <option [value]="f.id">{{ activityName(f.activityId) }} › {{ f.name }}</option>
                      }
                    </select>
                  }
                </div>
                <textarea class="input" [(ngModel)]="suggestionComment" style="margin-top:0.4rem"
                          placeholder="Motif de la décision (facultatif)…"></textarea>
                <div class="row" style="margin-top:0.4rem">
                  <button class="btn btn-sm btn-primary" (click)="acceptSuggestion(d, sg)"
                          [disabled]="!canAcceptSuggestion(sg)">
                    Accepter et créer la référence
                  </button>
                </div>
              }
            </div>
          }

          @if (isModeration(d)) {
            <div style="margin-top:0.6rem;border-top:1px solid var(--border);padding-top:0.6rem">
              <h3 style="font-size:0.85rem;margin:0 0 0.4rem">Décision de modération</h3>
              <div class="row">
                <select [(ngModel)]="modDecision">
                  <option value="NO_ACTION">Aucune action</option>
                  <option value="REQUEST_CORRECTION">Demander une correction</option>
                  <option value="HIDE">Masquer</option>
                  <option value="SUSPEND">Suspendre</option>
                  <option value="RESTORE">Rétablir</option>
                </select>
                <input class="input" [(ngModel)]="modJustification" placeholder="Justification" style="flex:1;min-width:180px" />
                <button class="btn btn-sm" (click)="decide(d)">Appliquer</button>
              </div>
              @if (modMsg()) { <p class="muted" style="margin:0.4rem 0 0">{{ modMsg() }}</p> }
            </div>
          }

          <h3 style="font-size:0.85rem;margin:0.8rem 0 0.4rem">Historique</h3>
          @for (e of d.events; track e.id) {
            <div class="entry">
              <strong>{{ e.kind }}</strong>
              <span class="muted"> · {{ e.occurredAt | date: 'dd/MM HH:mm' }} · {{ e.visibility === 'PUBLIC' ? 'public' : 'interne' }}</span>
              @if (e.body) { <div>{{ e.body }}</div> }
            </div>
          }

          <div style="margin-top:0.6rem">
            <textarea class="input" [(ngModel)]="commentBody" placeholder="Ajouter un commentaire…"></textarea>
            <div class="row" style="margin-top:0.4rem">
              <label class="muted"><input type="checkbox" [(ngModel)]="commentInternal" /> Interne</label>
              <button class="btn btn-sm" (click)="comment(d)" [disabled]="!commentBody.trim()">Commenter</button>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class CasesConsoleComponent implements OnInit {
  private readonly api = inject(CasesApi);
  private readonly toast = inject(ToastService);
  readonly cases = signal<CaseSummary[]>([]);
  readonly detail = signal<CaseDetail | null>(null);
  readonly catalog = signal<CaseCatalog | null>(null);
  readonly dash = signal<CaseDashboard | null>(null);
  readonly actionMsg = signal('');
  fStatus = '';
  fDomain = '';
  fPriority = '';
  fUnassigned = false;
  fSearch = '';
  // Tri + pagination serveur.
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = 25;
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  commentBody = '';
  commentInternal = true;
  // Changement d'état motivé (§11) et re-routage.
  newStatus = '';
  statusComment = '';
  rerouteDomain = '';
  rerouteComment = '';

  // Routing Rules (§14)
  readonly showRules = signal(false);
  readonly rules = signal<RoutingRule[]>([]);
  /** Brouillon de règle en cours de saisie (critères à choix multiple, sémantique « ou »). */
  nr = this.emptyRule();
  /** Avertissement non bloquant à la création (ex. règle sans aucun critère). */
  readonly ruleMsg = signal('');

  // --- Propositions d'ajout au référentiel (Case REFERENCE_SUGGESTION) ---
  private readonly refData = inject(ReferenceDataApi);
  readonly domains = signal<ReferentialItem[]>([]);
  readonly families = signal<FamilyDto[]>([]);
  readonly activities = signal<ActivityDto[]>([]);
  suggestionName = '';
  suggestionParentId = '';
  suggestionComment = '';

  /** Proposition portée par la Case, si c'en est une. Lue dans les métadonnées d'ouverture. */
  suggestionOf(d: CaseDetail): ReferenceSuggestion | null {
    if (d.type !== 'REFERENCE_SUGGESTION') {
      return null;
    }
    const suggestion = (d.metadata as { suggestion?: ReferenceSuggestion } | null)?.suggestion;
    return suggestion ?? null;
  }

  /** Référence déjà créée pour cette demande : la décision ne se rejoue pas. */
  createdReferenceOf(d: CaseDetail): string | null {
    return ((d.metadata as { createdReferenceId?: string } | null)?.createdReferenceId) ?? null;
  }

  kindLabel(kind: ReferenceKind): string {
    return REFERENCE_KIND_LABELS[kind] ?? kind;
  }

  /** Référentiels dont la création exige un parent : Activité → Domain, Sujet → Family. */
  parentKindOf(kind: ReferenceKind): 'DOMAIN' | 'FAMILY' | null {
    if (kind === 'ACTIVITY') return 'DOMAIN';
    if (kind === 'SUBJECT') return 'FAMILY';
    return null;
  }

  activityName(activityId: string): string {
    return this.activities().find((a) => a.id === activityId)?.name ?? '—';
  }

  canAcceptSuggestion(sg: ReferenceSuggestion): boolean {
    const name = (this.suggestionName || sg.label).trim();
    return name.length > 0 && (!this.parentKindOf(sg.kind) || !!this.suggestionParentId);
  }

  acceptSuggestion(d: CaseDetail, sg: ReferenceSuggestion): void {
    const name = (this.suggestionName || sg.label).trim();
    this.api
      .acceptReferenceSuggestion(d.id, {
        kind: sg.kind,
        name,
        parentId: this.suggestionParentId || undefined,
        comment: this.suggestionComment.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Référence créée', `« ${name} » ajoutée au référentiel ; demande résolue.`);
          this.suggestionName = '';
          this.suggestionParentId = '';
          this.suggestionComment = '';
          this.after();
        },
        // La Case reste ouverte en cas de refus du référentiel (doublon, terme interdit) : corriger
        // le libellé puis réessayer suffit.
        error: (err: unknown) => this.toast.fromHttp('Création refusée', err),
      });
  }

  // Modération (FSPEC.20)
  private readonly moderation = inject(ModerationApi);
  readonly modMsg = signal('');
  modDecision = 'NO_ACTION';
  modJustification = '';

  isModeration(d: CaseDetail): boolean {
    return d.domain === 'MODERATION';
  }

  decide(d: CaseDetail): void {
    this.modMsg.set('');
    this.moderation.decide(d.id, this.modDecision, this.modJustification.trim() || undefined).subscribe({
      next: () => {
        this.modMsg.set('✅ Décision appliquée et historisée.');
        this.modJustification = '';
        this.after();
      },
      error: (err) => this.modMsg.set(err?.error?.message ?? 'Décision refusée.'),
    });
  }

  ngOnInit(): void {
    this.api.catalog().subscribe((c) => this.catalog.set(c));
    this.load();
    this.refreshDash();
    // Parents proposables à l'acceptation d'une proposition d'ajout (Domain / Family).
    this.refData.domains().subscribe((list) => this.domains.set(list));
    this.refData.families().subscribe((list) => this.families.set(list));
    this.refData.activities().subscribe((list) => this.activities.set(list));
  }

  load(): void {
    this.api
      .list({
        status: this.fStatus,
        domain: this.fDomain,
        priority: this.fPriority,
        unassigned: this.fUnassigned ? 'true' : '',
        search: this.fSearch.trim(),
        sort: this.sortField,
        order: this.sortOrder,
        skip: String(this.page() * this.pageSize),
        take: String(this.pageSize),
      })
      .subscribe((res) => {
        this.cases.set(res.items);
        this.total.set(res.total);
      });
  }

  /** Filtre/recherche modifiés → on repart en page 1. */
  applyFilter(): void {
    this.page.set(0);
    this.load();
  }

  /** Tri par colonne (bascule le sens si déjà triée) ; revient en page 1. */
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.page.set(0);
    this.load();
  }

  arrow(field: string): string {
    return this.sortField === field ? (this.sortOrder === 'asc' ? '▲' : '▼') : '';
  }

  goToPage(delta: number): void {
    const next = Math.min(Math.max(0, this.page() + delta), this.pageCount() - 1);
    if (next !== this.page()) {
      this.page.set(next);
      this.load();
    }
  }

  private refreshDash(): void {
    this.api.dashboard().subscribe((d) => this.dash.set(d));
  }

  label(s: string): string {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  }

  select(c: CaseSummary): void {
    if (this.detail()?.id === c.id) {
      this.detail.set(null);
      return;
    }
    this.api.detail(c.id).subscribe((d) => this.detail.set(d));
  }

  private after(): void {
    const id = this.detail()?.id;
    if (id) {
      this.api.detail(id).subscribe((d) => this.detail.set(d));
    }
    this.load();
    this.refreshDash();
  }

  claim(d: CaseDetail): void {
    this.api.claim(d.id).subscribe(() => this.after());
  }

  /** Applique un changement d'état motivé (transition autorisée + commentaire obligatoire). */
  applyStatus(d: CaseDetail): void {
    if (!this.newStatus || !this.statusComment.trim()) {
      return;
    }
    this.actionMsg.set('');
    this.api.setStatus(d.id, this.newStatus, this.statusComment.trim()).subscribe({
      next: () => {
        this.newStatus = '';
        this.statusComment = '';
        this.after();
      },
      error: (err) => this.actionMsg.set(err?.error?.message ?? 'Transition refusée.'),
    });
  }

  /** Re-route vers un autre domaine / file (routage incorrect), motivé. */
  applyReroute(d: CaseDetail): void {
    if (!this.rerouteDomain || !this.rerouteComment.trim()) {
      return;
    }
    this.actionMsg.set('');
    this.api.reroute(d.id, this.rerouteDomain, this.rerouteComment.trim()).subscribe({
      next: () => {
        this.rerouteDomain = '';
        this.rerouteComment = '';
        this.after();
      },
      error: (err) => this.actionMsg.set(err?.error?.message ?? 'Re-routage refusé.'),
    });
  }

  setPriority(d: CaseDetail, priority: string): void {
    if (priority === d.priority) {
      return;
    }
    this.api.setPriority(d.id, priority).subscribe(() => this.after());
  }

  escalate(d: CaseDetail): void {
    this.api.escalate(d.id).subscribe(() => this.after());
  }

  comment(d: CaseDetail): void {
    this.api.comment(d.id, this.commentBody.trim(), this.commentInternal).subscribe(() => {
      this.commentBody = '';
      this.after();
    });
  }

  // --- Routing Rules ---
  toggleRules(): void {
    this.showRules.update((v) => !v);
    if (this.showRules() && this.rules().length === 0) {
      this.loadRules();
    }
  }

  private loadRules(): void {
    this.api.routingRules().subscribe((list) => this.rules.set(list));
  }

  /**
   * Résumé lisible des critères d'une règle. Les valeurs d'un même critère sont séparées par « ou »
   * (l'une suffit) ; les critères entre eux par « et » (tous doivent être vrais) — exactement la
   * sémantique du moteur.
   */
  ruleCriteria(r: RoutingRule): string {
    const c = r.criteria as {
      types?: string[];
      origins?: string[];
      requiresEvent?: boolean;
      aiConfidenceBelow?: number;
    };
    const parts: string[] = [];
    if (c.types?.length) {
      parts.push(`type = ${c.types.map((t) => this.label(t)).join(' ou ')}`);
    }
    if (c.origins?.length) {
      parts.push(`origine = ${c.origins.map((o) => this.label(o)).join(' ou ')}`);
    }
    if (c.requiresEvent) {
      parts.push('rattachée à un événement');
    }
    if (c.aiConfidenceBelow != null) {
      parts.push(`confiance IA < ${c.aiConfidenceBelow}`);
    }
    return parts.length ? parts.join(' et ') : 'toutes les demandes';
  }

  ruleDomain(r: RoutingRule): string {
    return (r.result as { domain?: string }).domain ?? '';
  }

  rulePriority(r: RoutingRule): string {
    return (r.result as { priority?: string }).priority ?? '';
  }

  toggleRuleActive(r: RoutingRule, event: Event): void {
    const isActive = (event.target as HTMLInputElement).checked;
    this.api
      .updateRule(r.id, { name: r.name, orderIndex: r.orderIndex, isActive, criteria: r.criteria, result: r.result })
      .subscribe(() => this.loadRules());
  }

  deleteRule(r: RoutingRule): void {
    if (!confirm(`Supprimer la règle « ${r.name} » ?`)) {
      return;
    }
    this.api.deleteRule(r.id).subscribe(() => this.loadRules());
  }

  /** Coche / décoche une valeur dans un critère à choix multiple (sémantique « ou »). */
  toggleIn(list: string[], value: string): void {
    const index = list.indexOf(value);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
  }

  /**
   * Crée une règle à partir des critères cochés. Un critère vide n'est pas transmis : il n'est donc
   * pas testé par le moteur (une règle sans aucun critère s'applique à toutes les demandes).
   */
  addRule(): void {
    const criteria: Record<string, unknown> = {};
    if (this.nr.types.length) {
      criteria['types'] = [...this.nr.types];
    }
    if (this.nr.origins.length) {
      criteria['origins'] = [...this.nr.origins];
    }
    if (this.nr.requiresEvent) {
      criteria['requiresEvent'] = true;
    }
    const confidence = Number(this.nr.aiConfidenceBelow);
    if (this.nr.aiConfidenceBelow !== '' && !Number.isNaN(confidence)) {
      criteria['aiConfidenceBelow'] = confidence;
    }
    const result: Record<string, unknown> = { domain: this.nr.domain };
    if (this.nr.priority) {
      result['priority'] = this.nr.priority;
    }
    this.ruleMsg.set(
      Object.keys(criteria).length === 0
        ? '⚠️ Règle sans critère : elle s’appliquera à toutes les demandes non captées avant elle.'
        : '',
    );
    this.api
      .createRule({ name: this.nr.name.trim(), orderIndex: Number(this.nr.orderIndex), criteria, result })
      .subscribe(() => {
        this.nr = this.emptyRule();
        this.loadRules();
      });
  }

  private emptyRule(): {
    name: string;
    orderIndex: number;
    types: string[];
    origins: string[];
    requiresEvent: boolean;
    aiConfidenceBelow: string;
    domain: string;
    priority: string;
  } {
    return {
      name: '',
      orderIndex: 10,
      types: [],
      origins: [],
      requiresEvent: false,
      aiConfidenceBelow: '',
      domain: '',
      priority: '',
    };
  }
}
