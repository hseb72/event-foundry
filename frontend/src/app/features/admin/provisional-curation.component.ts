import { Component, OnInit, inject } from '@angular/core';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ProvisionalEntry, ProvisionalType } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

const TYPE_LABELS: Record<ProvisionalType, string> = {
  activity: 'Activité',
  eventType: "Type d'événement",
  eventFormat: 'Format',
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
  styles: [
    `
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;
      }
      th,
      td {
        text-align: left;
        padding: 0.5rem 0.6rem;
        border-bottom: 1px solid var(--border);
      }
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
      <table>
        <thead>
          <tr><th>Type</th><th>Nom</th><th>Contexte</th><th>Créé</th><th></th></tr>
        </thead>
        <tbody>
          @for (e of entries; track e.type + e.id) {
            <tr>
              <td><span class="type">{{ typeLabel(e.type) }}</span></td>
              <td><strong>{{ e.name }}</strong></td>
              <td class="muted">{{ e.context ?? '—' }}</td>
              <td class="when">{{ when(e.createdAt) }}</td>
              <td>
                <div class="actions">
                  <button class="btn" [disabled]="busy" (click)="confirm(e)">Confirmer</button>
                  <button class="btn" [disabled]="busy" (click)="remove(e)">Supprimer</button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class ProvisionalCurationComponent implements OnInit {
  private readonly api = inject(ReferenceDataApi);

  entries: ProvisionalEntry[] = [];
  loading = true;
  busy = false;
  error = '';

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
