import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseCatalog, CaseDashboard, CaseDetail, CaseSummary, CasesApi } from '../../core/api/cases.service';

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

      @if (detail(); as d) {
        <section class="card">
          <div class="row" style="justify-content:space-between">
            <h2 style="margin:0">{{ d.reference }} — {{ d.subject }}</h2>
            <span class="muted">{{ label(d.domain) }} · {{ d.workQueue }}</span>
          </div>
          <p class="muted">{{ d.description }}</p>

          <div class="row">
            <button class="btn btn-sm" (click)="claim(d)">Prendre en charge</button>
            <select [ngModel]="d.status" (ngModelChange)="setStatus(d, $event)">
              @for (s of catalog()?.statuses ?? []; track s) { <option [value]="s">{{ label(s) }}</option> }
            </select>
            <select [ngModel]="d.priority" (ngModelChange)="setPriority(d, $event)">
              @for (p of catalog()?.priorities ?? []; track p) { <option [value]="p">{{ label(p) }}</option> }
            </select>
            <button class="btn btn-sm" (click)="escalate(d)">Escalader</button>
          </div>
          @if (actionMsg()) { <p class="muted" style="margin:0.4rem 0 0">{{ actionMsg() }}</p> }

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

  setStatus(d: CaseDetail, status: string): void {
    if (status === d.status) {
      return;
    }
    this.api.setStatus(d.id, status).subscribe({
      next: () => this.after(),
      error: (err) => this.actionMsg.set(err?.error?.message ?? 'Transition refusée.'),
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
}
