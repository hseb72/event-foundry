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
  templateUrl: './support.component.html',
  styleUrl: './support.component.css',
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
