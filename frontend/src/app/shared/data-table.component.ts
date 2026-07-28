import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

/** Colonne déclarative d'un tableau : libellé + accès à la valeur (utilisée pour l'affichage,
 *  le tri et la recherche). `sortable` autorise le tri par clic sur l'entête. */
export interface DataColumn {
  key: string;
  label: string;
  sortable?: boolean;
  value: (row: Record<string, unknown>) => string;
}

/**
 * Tableau réutilisable : **triable, filtrable (recherche texte) et paginé** — mode client (les
 * lignes complètes sont fournies via `[rows]`, adapté aux listes bornées : référentiels, etc.).
 * Rendu générique par colonnes déclaratives ; une cellule d'actions par ligne est projetée via
 * `[rowActions]` (`<ng-template let-row>`). Pour les grands volumes, un mode serveur pourra
 * être ajouté (loader + total) sans changer l'API des consommateurs.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [FormsModule, NgClass, NgTemplateOutlet],
  styles: [
    `
      .dt-search { margin-bottom: 0.6rem; }
      .dt-search input { border: 1px solid var(--border); border-radius: 8px; padding: 0.45rem 0.7rem; font: inherit; background: var(--bg); color: var(--text); min-width: 220px; }
      .dt-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
      th.sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      th .arr { color: var(--exp); font-size: 0.8em; }
      tbody tr.clickable { cursor: pointer; }
      .pager { display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-top: 0.6rem; }
      .muted { color: var(--muted); }
    `,
  ],
  template: `
    @if (searchable) {
      <div class="dt-search">
        <input [(ngModel)]="search" (ngModelChange)="onSearch()" [placeholder]="searchPlaceholder" />
      </div>
    }
    <div class="dt-wrap">
      <table>
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th [class.sortable]="col.sortable" (click)="sortBy(col)">
                {{ col.label }}
                @if (col.sortable) { <span class="arr">{{ arrow(col) }}</span> }
              </th>
            }
            @if (rowActions) { <th>{{ actionsLabel }}</th> }
          </tr>
        </thead>
        <tbody>
          @for (row of paged; track rowId(row)) {
            <tr [ngClass]="rowClass(row)" [class.clickable]="rowClickable"
                (click)="rowClickable ? rowClick.emit(row) : null">
              @for (col of columns; track col.key) {
                <td>{{ col.value(row) }}</td>
              }
              @if (rowActions) {
                <td (click)="$event.stopPropagation()">
                  <ng-container [ngTemplateOutlet]="rowActions" [ngTemplateOutletContext]="{ $implicit: row }" />
                </td>
              }
            </tr>
          } @empty {
            <tr><td [attr.colspan]="colspan" class="muted">{{ emptyLabel }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    @if (pageCount > 1) {
      <div class="pager">
        <span class="muted">{{ total }} entrée(s) · page {{ clampedPage + 1 }}/{{ pageCount }}</span>
        <button type="button" class="btn btn-sm" [disabled]="clampedPage === 0" (click)="go(-1)">‹</button>
        <button type="button" class="btn btn-sm" [disabled]="clampedPage >= pageCount - 1" (click)="go(1)">›</button>
      </div>
    }
  `,
})
export class DataTableComponent {
  @Input({ required: true }) columns: DataColumn[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  /** Cellule d'actions projetée par ligne (`<ng-template let-row>…</ng-template>`). */
  @Input() rowActions: TemplateRef<{ $implicit: Record<string, unknown> }> | null = null;
  @Input() actionsLabel = '';
  @Input() searchable = true;
  @Input() searchPlaceholder = 'Rechercher…';
  @Input() pageSize = 10;
  @Input() emptyLabel = 'Aucune entrée.';
  @Input() rowClickable = false;
  @Input() rowId: (row: Record<string, unknown>) => string = (row) => String(row['id'] ?? '');
  @Input() rowClass: (row: Record<string, unknown>) => Record<string, boolean> = () => ({});
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  search = '';
  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';
  page = 0;

  private get filtered(): Record<string, unknown>[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter((r) => this.columns.some((c) => c.value(r).toLowerCase().includes(q)));
  }

  private get sorted(): Record<string, unknown>[] {
    const col = this.columns.find((c) => c.key === this.sortKey);
    if (!col) return this.filtered;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...this.filtered].sort(
      (a, b) => col.value(a).localeCompare(col.value(b), undefined, { numeric: true }) * dir,
    );
  }

  get total(): number {
    return this.filtered.length;
  }
  get pageCount(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }
  get clampedPage(): number {
    return Math.min(this.page, this.pageCount - 1);
  }
  get paged(): Record<string, unknown>[] {
    const start = this.clampedPage * this.pageSize;
    return this.sorted.slice(start, start + this.pageSize);
  }
  get colspan(): number {
    return this.columns.length + (this.rowActions ? 1 : 0);
  }

  onSearch(): void {
    this.page = 0;
  }

  sortBy(col: DataColumn): void {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.page = 0;
  }

  arrow(col: DataColumn): string {
    return this.sortKey === col.key ? (this.sortDir === 'asc' ? '▲' : '▼') : '';
  }

  go(delta: number): void {
    this.page = Math.min(Math.max(0, this.clampedPage + delta), this.pageCount - 1);
  }
}
