import { Component, OnInit, inject } from '@angular/core';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ProvisionalEntry, ProvisionalType } from '../../core/models';
import { DataColumn, DataTableComponent } from '../../shared/data-table.component';
import { formatDateTime } from '../../shared/date-format';

const TYPE_LABELS: Record<ProvisionalType, string> = {
  activity: 'Activité',
  eventType: "Type d'événement",
  subject: 'Sujet',
  modality: 'Modalité',
  organizer: 'Organisateur',
  venue: 'Lieu',
};

/**
 * File de curation des référentiels provisoires (ADR.24) : entrées auto-créées lors des imports,
 * à confirmer (curées) ou supprimer. Réservée à `reference.manage`.
 */
@Component({
  selector: 'app-provisional-curation',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './provisional-curation.component.html',
  styleUrl: './provisional-curation.component.css',
})
export class ProvisionalCurationComponent implements OnInit {
  private readonly api = inject(ReferenceDataApi);

  entries: ProvisionalEntry[] = [];
  loading = true;
  busy = false;
  error = '';

  readonly columns: DataColumn[] = [
    { key: 'type', label: 'Type', sortable: true, value: (r) => this.typeLabel(r['type'] as ProvisionalType), cellTemplate: 'type' },
    { key: 'name', label: 'Nom', sortable: true, value: (r) => String(r['name'] ?? '') },
    { key: 'context', label: 'Contexte', sortable: true, value: (r) => String(r['context'] ?? '—') },
    {
      key: 'createdAt',
      label: 'Créé',
      sortable: true,
      value: (r) => this.when(String(r['createdAt'] ?? '')),
      sortValue: (r) => String(r['createdAt'] ?? ''),
    },
  ];

  readonly rowId = (row: Record<string, unknown>): string => `${row['type']}:${row['id']}`;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.api.listProvisional().subscribe({
      next: (items) => {
        this.entries = items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  confirm(entry: ProvisionalEntry): void {
    this.busy = true;
    this.error = '';
    this.api.confirmProvisional(entry.type, entry.id).subscribe({
      next: () => this.afterAction(entry),
      error: (err) => this.onError(err),
    });
  }

  remove(entry: ProvisionalEntry): void {
    this.busy = true;
    this.error = '';
    this.api.removeProvisional(entry.type, entry.id).subscribe({
      next: () => this.afterAction(entry),
      error: (err) => this.onError(err),
    });
  }

  private afterAction(entry: ProvisionalEntry): void {
    this.busy = false;
    this.entries = this.entries.filter((e) => !(e.type === entry.type && e.id === entry.id));
  }

  private onError(err: { error?: { message?: string } }): void {
    this.busy = false;
    this.error = err?.error?.message ?? 'Action impossible.';
  }

  typeLabel(type: ProvisionalType): string {
    return TYPE_LABELS[type];
  }

  when(iso: string): string {
    return formatDateTime(iso);
  }
}
