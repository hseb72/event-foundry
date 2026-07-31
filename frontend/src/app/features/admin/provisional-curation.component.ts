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
  styles: [
    `
      .type {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--orange, #d97706) 14%, transparent);
        color: var(--orange, #b45309);
      }
      .when {
        color: var(--muted);
        font-size: 0.82rem;
      }
      .actions {
        display: flex;
        gap: 0.4rem;
        justify-content: flex-end;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
      .err {
        color: var(--red, #c0392b);
        font-size: 0.85rem;
      }
    `,
  ],
  template: `
    <h1>Référentiels provisoires</h1>
    <p class="muted">
      Entrées créées automatiquement lors des imports (auto-provisioning, ADR.24). Confirmez celles à
      conserver ; supprimez les entrées parasites ou en double.
    </p>

    @if (error) {
      <p class="err">{{ error }}</p>
    }

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (entries.length === 0) {
      <p class="empty">Aucun référentiel provisoire. ✓</p>
    } @else {
      <app-data-table
        [columns]="columns"
        [rows]="$any(entries)"
        [cellTemplates]="{ type: typeCell }"
        [rowActions]="actions"
        actionsLabel=""
        [pageSize]="15"
        [rowId]="rowId"
        searchPlaceholder="Rechercher une entrée provisoire…"
      />
      <ng-template #typeCell let-e>
        <span class="type">{{ typeLabel(e.type) }}</span>
      </ng-template>
      <ng-template #actions let-e>
        <div class="actions">
          <button class="btn" [disabled]="busy" (click)="confirm($any(e))">Confirmer</button>
          <button class="btn" [disabled]="busy" (click)="remove($any(e))">Supprimer</button>
        </div>
      </ng-template>
    }
  `,
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
