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
  templateUrl: './cases-console.component.html',
  styleUrl: './cases-console.component.css',
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
  readonly eventTypes = signal<ReferentialItem[]>([]);
  readonly subjects = signal<ReferentialItem[]>([]);
  readonly organizers = signal<ReferentialItem[]>([]);
  readonly venues = signal<ReferentialItem[]>([]);
  /** Deux issues possibles : créer une référence, ou enrichir une référence existante d'un alias. */
  suggestionMode: 'CREATE' | 'ALIAS' = 'CREATE';
  suggestionName = '';
  suggestionParentId = '';
  aliasTargetId = '';
  suggestionComment = '';

  /** Entrées existantes du référentiel visé — cibles possibles d'un libellé alternatif. */
  aliasCandidates(kind: ReferenceKind): ReferentialItem[] {
    switch (kind) {
      case 'ACTIVITY':
        return this.activities();
      case 'EVENT_TYPE':
        return this.eventTypes();
      case 'SUBJECT':
        return this.subjects();
      case 'ORGANIZER':
        return this.organizers();
      case 'VENUE':
        return this.venues();
    }
  }

  /** Décision déjà prise sur cette demande : elle ne se rejoue pas. */
  decidedSuggestion(d: CaseDetail): string | null {
    const meta = d.metadata as { createdReferenceId?: string; createdAliasId?: string } | null;
    if (meta?.createdReferenceId) return 'Référence créée pour cette demande.';
    if (meta?.createdAliasId) return 'Libellé alternatif enregistré pour cette demande.';
    return null;
  }

  aliasSuggestion(d: CaseDetail, sg: ReferenceSuggestion): void {
    const value = (this.suggestionName || sg.label).trim();
    this.api
      .aliasReferenceSuggestion(d.id, {
        target: sg.kind,
        targetId: this.aliasTargetId,
        value,
        comment: this.suggestionComment.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success(
            'Libellé alternatif enregistré',
            `« ${value} » sera désormais reconnu ; demande résolue.`,
          );
          this.resetSuggestionForm();
          this.after();
        },
        error: (err: unknown) => this.toast.fromHttp('Enregistrement refusé', err),
      });
  }

  private resetSuggestionForm(): void {
    this.suggestionName = '';
    this.suggestionParentId = '';
    this.aliasTargetId = '';
    this.suggestionComment = '';
  }

  /** Proposition portée par la Case, si c'en est une. Lue dans les métadonnées d'ouverture. */
  suggestionOf(d: CaseDetail): ReferenceSuggestion | null {
    if (d.type !== 'REFERENCE_SUGGESTION') {
      return null;
    }
    const suggestion = (d.metadata as { suggestion?: ReferenceSuggestion } | null)?.suggestion;
    return suggestion ?? null;
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
          this.resetSuggestionForm();
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
    // Cibles possibles d'un libellé alternatif, pour chaque référentiel aliasable.
    this.refData.eventTypes().subscribe((list) => this.eventTypes.set(list));
    this.refData.subjects().subscribe((list) => this.subjects.set(list));
    this.refData.organizers().subscribe((list) => this.organizers.set(list));
    this.refData.venues().subscribe((list) => this.venues.set(list));
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
