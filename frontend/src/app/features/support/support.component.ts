import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseCatalog, CaseDetail, CaseSummary, CasesApi } from '../../core/api/cases.service';

/** Type de demande présentés au demandeur (sous-ensemble lisible du catalogue). */
const USER_TYPES: { value: string; label: string }[] = [
  { value: 'SUPPORT_REQUEST', label: "Demande d'assistance" },
  { value: 'CONTENT_REPORT', label: 'Signaler un contenu' },
  { value: 'ABUSE_REPORT', label: 'Signaler un abus' },
  { value: 'TECHNICAL_INCIDENT', label: 'Incident technique' },
  { value: 'DATA_CORRECTION', label: 'Correction de données' },
  { value: 'BILLING_REQUEST', label: 'Question de facturation' },
  { value: 'OTHER', label: 'Autre' },
];

/**
 * Espace « Aide & demandes » du demandeur (FSPEC.21) : ouvrir une demande adressée aux Operators et
 * suivre l'avancement de ses propres demandes (les échanges internes ne sont pas visibles).
 */
@Component({
  selector: 'app-support',
  standalone: true,
  imports: [FormsModule, DatePipe],
  styles: [
    `
      .row { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
      .muted { opacity: 0.75; font-size: 0.85rem; }
      .case { padding: 0.6rem 0.8rem; border-radius: 10px; background: var(--card, #211a2e); border: 1px solid rgba(255,255,255,0.08); cursor: pointer; }
      .badge { font-size: 0.72rem; padding: 0.05rem 0.5rem; border-radius: 999px; background: rgba(255,255,255,0.12); }
      .field { display: grid; gap: 0.3rem; }
      textarea.input { min-height: 90px; }
      .log { display: grid; gap: 0.4rem; margin-top: 0.6rem; }
      .entry { font-size: 0.85rem; border-left: 2px solid rgba(255,255,255,0.15); padding-left: 0.6rem; }
    `,
  ],
  template: `
    <div class="page">
      <h1>Aide & demandes</h1>

      <section class="card">
        <h2>Nouvelle demande</h2>
        <div class="field"><label class="muted">Type</label>
          <select [(ngModel)]="type">
            @for (t of userTypes; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
          </select>
        </div>
        <div class="field" style="margin-top:0.5rem"><label class="muted">Objet</label>
          <input class="input" [(ngModel)]="subject" maxlength="200" /></div>
        <div class="field" style="margin-top:0.5rem"><label class="muted">Description</label>
          <textarea class="input" [(ngModel)]="description"></textarea></div>
        <div style="margin-top:0.6rem"><button class="btn btn-primary" (click)="submit()"
          [disabled]="subject.trim().length < 3 || description.trim().length < 3">Envoyer</button>
          @if (sentRef()) { <span class="muted"> Demande {{ sentRef() }} créée.</span> }</div>
      </section>

      <section class="card">
        <h2>Mes demandes</h2>
        @for (c of cases(); track c.id) {
          <div class="case" (click)="openDetail(c)" style="margin-bottom:0.5rem">
            <div class="row" style="justify-content:space-between">
              <strong>{{ c.subject }}</strong>
              <span class="badge">{{ statusLabel(c.status) }}</span>
            </div>
            <div class="muted">{{ c.reference }} · {{ c.createdAt | date: 'dd/MM/yyyy' }}</div>
            @if (detail()?.id === c.id) {
              <div class="log" (click)="$event.stopPropagation()">
                <p class="muted" style="margin:0">{{ detail()!.description }}</p>
                @for (e of detail()!.events; track e.id) {
                  <div class="entry"><strong>{{ e.kind }}</strong>
                    <span class="muted"> · {{ e.occurredAt | date: 'dd/MM HH:mm' }}</span>
                    @if (e.body) { <div>{{ e.body }}</div> }
                  </div>
                } @empty { <span class="muted">Pas encore de réponse.</span> }

                <div style="margin-top:0.5rem">
                  @if (isWaiting(detail()!)) {
                    <p style="margin:0 0 0.3rem">⏳ Une information est attendue de votre part — répondez ci-dessous.</p>
                  }
                  <textarea class="input" [(ngModel)]="replyBody" placeholder="Apporter un élément complémentaire…"></textarea>
                  <div class="row" style="margin-top:0.3rem">
                    <button class="btn btn-sm btn-primary" (click)="reply(c)" [disabled]="!replyBody.trim()">Envoyer</button>
                  </div>
                  @if (replyMsg()) { <p class="muted" style="margin:0.3rem 0 0">{{ replyMsg() }}</p> }
                </div>
              </div>
            }
          </div>
        } @empty { <p class="muted">Aucune demande pour le moment.</p> }
      </section>
    </div>
  `,
})
export class SupportComponent implements OnInit {
  private readonly api = inject(CasesApi);
  readonly userTypes = USER_TYPES;
  readonly cases = signal<CaseSummary[]>([]);
  readonly detail = signal<CaseDetail | null>(null);
  readonly sentRef = signal('');
  readonly replyMsg = signal('');
  type = 'SUPPORT_REQUEST';
  subject = '';
  description = '';
  replyBody = '';
  private catalog: CaseCatalog | null = null;

  /** La demande attend une information du demandeur. */
  isWaiting(d: CaseDetail): boolean {
    return d.status === 'WAITING_FOR_USER' || d.status === 'WAITING_FOR_ORGANIZER';
  }

  /** Le demandeur apporte un élément supplémentaire (relance une demande en attente). */
  reply(c: CaseSummary): void {
    const body = this.replyBody.trim();
    if (!body) {
      return;
    }
    this.replyMsg.set('');
    this.api.replyToMyCase(c.id, body).subscribe({
      next: () => {
        this.replyBody = '';
        this.replyMsg.set('✅ Élément transmis.');
        this.api.myCase(c.id).subscribe((d) => this.detail.set(d));
        this.reload();
      },
      error: (err) => this.replyMsg.set(err?.error?.message ?? 'Envoi impossible.'),
    });
  }

  ngOnInit(): void {
    this.reload();
    this.api.catalog().subscribe((c) => (this.catalog = c));
  }

  private reload(): void {
    this.api.mine().subscribe((list) => this.cases.set(list));
  }

  statusLabel(s: string): string {
    return s.replace(/_/g, ' ').toLowerCase();
  }

  submit(): void {
    this.api.open({ type: this.type, subject: this.subject.trim(), description: this.description.trim() }).subscribe({
      next: (c) => {
        this.sentRef.set(c.reference);
        this.subject = '';
        this.description = '';
        this.reload();
      },
    });
  }

  openDetail(c: CaseSummary): void {
    if (this.detail()?.id === c.id) {
      this.detail.set(null);
      return;
    }
    this.api.myCase(c.id).subscribe((d) => this.detail.set(d));
  }
}
