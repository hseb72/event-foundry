import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CaseCatalog,
  CaseDashboard,
  CaseDetail,
  CaseSummary,
  CasesApi,
  RoutingRule,
} from '../../core/api/cases.service';
import { ModerationApi } from '../../core/api/moderation.service';

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
      .row { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
      .muted { opacity: 0.75; font-size: 0.85rem; }
      .kpis { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
      .kpi { background: var(--card, #211a2e); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.6rem 1rem; }
      .kpi b { font-size: 1.4rem; display: block; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.85rem; }
      tr.sel { background: rgba(219,39,119,0.12); }
      .badge { font-size: 0.72rem; padding: 0.05rem 0.5rem; border-radius: 999px; background: rgba(255,255,255,0.12); }
      .crit { background: rgba(239,68,68,0.3); }
      .entry { font-size: 0.85rem; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 0.6rem; margin-bottom: 0.4rem; }
      textarea.input { min-height: 60px; }
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
        <div class="row" style="margin-bottom:0.6rem">
          <select [(ngModel)]="fStatus" (ngModelChange)="load()">
            <option value="">Tout statut</option>
            @for (s of catalog()?.statuses ?? []; track s) { <option [value]="s">{{ label(s) }}</option> }
          </select>
          <select [(ngModel)]="fDomain" (ngModelChange)="load()">
            <option value="">Tout domaine</option>
            @for (dm of catalog()?.domains ?? []; track dm) { <option [value]="dm">{{ label(dm) }}</option> }
          </select>
          <select [(ngModel)]="fPriority" (ngModelChange)="load()">
            <option value="">Toute priorité</option>
            @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
          </select>
          <label class="muted"><input type="checkbox" [(ngModel)]="fUnassigned" (ngModelChange)="load()" /> Non affectées</label>
        </div>

        <table>
          <thead><tr><th>Réf.</th><th>Objet</th><th>Domaine</th><th>Priorité</th><th>Statut</th><th>Assignee</th></tr></thead>
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
      </section>

      <section class="card">
        <div class="row" style="justify-content:space-between">
          <h2 style="margin:0">Règles de routage</h2>
          <button class="btn btn-sm" (click)="toggleRules()">{{ showRules() ? 'Masquer' : 'Configurer' }}</button>
        </div>
        @if (showRules()) {
          <p class="muted">Évaluées par ordre croissant ; la première applicable l'emporte. Sinon, repli sur le routage par défaut.</p>
          <table>
            <thead><tr><th>Ordre</th><th>Nom</th><th>Si (type)</th><th>→ Domaine / priorité</th><th>Active</th><th></th></tr></thead>
            <tbody>
              @for (r of rules(); track r.id) {
                <tr>
                  <td>{{ r.orderIndex }}</td>
                  <td>{{ r.name }}</td>
                  <td class="muted">{{ ruleTypes(r) }}</td>
                  <td>{{ label(ruleDomain(r)) }}{{ rulePriority(r) ? ' · ' + label(rulePriority(r)) : '' }}</td>
                  <td><input type="checkbox" [checked]="r.isActive !== false" (change)="toggleRuleActive(r, $event)" /></td>
                  <td><button class="btn btn-sm danger" (click)="deleteRule(r)">Suppr.</button></td>
                </tr>
              } @empty { <tr><td colspan="6" class="muted">Aucune règle : routage par défaut appliqué.</td></tr> }
            </tbody>
          </table>

          <h3 style="font-size:0.85rem;margin:0.8rem 0 0.4rem">Nouvelle règle</h3>
          <div class="row">
            <input class="input" [(ngModel)]="nr.name" placeholder="Nom" style="width:160px" />
            <input class="input" type="number" [(ngModel)]="nr.orderIndex" placeholder="Ordre" style="width:80px" />
            <input class="input" [(ngModel)]="nr.types" placeholder="Types (séparés par ,)" style="width:220px" />
            <select [(ngModel)]="nr.domain">
              @for (dm of catalog()?.domains ?? []; track dm) { <option [value]="dm">{{ label(dm) }}</option> }
            </select>
            <select [(ngModel)]="nr.priority">
              <option value="">Priorité (auto)</option>
              @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
            </select>
            <button class="btn btn-sm" (click)="addRule()" [disabled]="!nr.name.trim() || !nr.domain">Ajouter</button>
          </div>
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
          <div style="margin-top:0.6rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:0.6rem">
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
          <div style="margin-top:0.6rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:0.6rem">
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

          @if (isModeration(d)) {
            <div style="margin-top:0.6rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:0.6rem">
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
  readonly cases = signal<CaseSummary[]>([]);
  readonly detail = signal<CaseDetail | null>(null);
  readonly catalog = signal<CaseCatalog | null>(null);
  readonly dash = signal<CaseDashboard | null>(null);
  readonly actionMsg = signal('');
  fStatus = '';
  fDomain = '';
  fPriority = '';
  fUnassigned = false;
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
  nr = { name: '', orderIndex: 10, types: '', domain: '', priority: '' };

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
  }

  load(): void {
    this.api
      .list({
        status: this.fStatus,
        domain: this.fDomain,
        priority: this.fPriority,
        unassigned: this.fUnassigned ? 'true' : '',
      })
      .subscribe((list) => this.cases.set(list));
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

  ruleTypes(r: RoutingRule): string {
    const t = (r.criteria as { types?: string[] }).types;
    return t?.length ? t.join(', ') : 'tous';
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

  addRule(): void {
    const types = this.nr.types.split(',').map((s) => s.trim()).filter(Boolean);
    const criteria: Record<string, unknown> = types.length ? { types } : {};
    const result: Record<string, unknown> = { domain: this.nr.domain };
    if (this.nr.priority) {
      result['priority'] = this.nr.priority;
    }
    this.api
      .createRule({ name: this.nr.name.trim(), orderIndex: Number(this.nr.orderIndex), criteria, result })
      .subscribe(() => {
        this.nr = { name: '', orderIndex: 10, types: '', domain: '', priority: '' };
        this.loadRules();
      });
  }
}
