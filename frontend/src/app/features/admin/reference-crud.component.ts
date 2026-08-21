import { Component, Input, OnChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminReferenceApi, ReferenceRow } from '../../core/api/admin-reference.service';
import { ReferentialItem } from '../../core/models';
import { DataColumn, DataTableComponent, DataTableQuery } from '../../shared/data-table.component';
import { EntityDef, FieldDef } from './reference-admin.model';

/**
 * CRUD générique d'un référentiel, piloté par un `EntityDef`. Liste (inactifs inclus),
 * création, édition (nom + activation + champs mutables) et désactivation logique.
 */
@Component({
  selector: 'app-reference-crud',
  standalone: true,
  imports: [FormsModule, DataTableComponent],
  templateUrl: './reference-crud.component.html',
  styleUrl: './reference-crud.component.css',
})
export class ReferenceCrudComponent implements OnChanges {
  private readonly api = inject(AdminReferenceApi);

  @Input({ required: true }) entity!: EntityDef;

  rows: ReferenceRow[] = [];
  /** Total serveur (mode paginé uniquement). */
  total = 0;
  loading = false;
  formOpen = false;
  busy = false;
  error = '';

  editingId: string | null = null;
  editIsActive = true;
  model: Record<string, string> = {};

  /** Dernière requête serveur (mode paginé) — rejouée après une mutation pour rester sur la page. */
  private lastQuery: DataTableQuery = {
    search: '',
    sortKey: '',
    sortDir: 'asc',
    page: 0,
    pageSize: 15,
  };

  private readonly optionsCache: Record<string, ReferentialItem[]> = {};

  ngOnChanges(): void {
    this.formOpen = false;
    this.error = '';
    this.lastQuery = { search: '', sortKey: '', sortDir: 'asc', page: 0, pageSize: 15 };
    this.loadOptions();
    this.reload();
  }

  reload(): void {
    if (this.entity.paged) {
      this.loadPage(this.lastQuery);
      return;
    }
    this.loading = true;
    this.api.list(this.entity.segment).subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  /** Réagit aux changements de tri / recherche / page émis par le tableau en mode serveur. */
  onQuery(query: DataTableQuery): void {
    this.lastQuery = query;
    this.loadPage(query);
  }

  private loadPage(query: DataTableQuery): void {
    this.loading = true;
    this.api
      .listPaged(this.entity.segment, {
        includeInactive: true,
        search: query.search || undefined,
        sort: query.sortKey || undefined,
        order: query.sortDir,
        skip: query.page * query.pageSize,
        take: query.pageSize,
      })
      .subscribe({
        next: (page) => {
          this.rows = page.items;
          this.total = page.total;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  /** Colonnes du tableau générique : champs de l'entité + colonne d'état (triables/cherchables). */
  get tableColumns(): DataColumn[] {
    // En mode serveur, seules les colonnes acceptées par le backend sont triables (liste blanche).
    const sortable = (key: string): boolean =>
      this.entity.paged ? (this.entity.serverSortFields ?? []).includes(key) : true;
    const cols: DataColumn[] = this.entity.fields.map((f) => ({
      key: f.key,
      label: f.label,
      sortable: sortable(f.key),
      value: (row) => this.display(row as ReferenceRow, f),
    }));
    cols.push({
      key: 'isActive',
      label: 'État',
      sortable: sortable('isActive'),
      value: (row) => (row['isActive'] ? 'Actif' : 'Inactif'),
    });
    return cols;
  }

  readonly rowClassFn = (row: Record<string, unknown>): Record<string, boolean> => ({
    inactive: !row['isActive'],
  });

  optionsFor(field: FieldDef): ReferentialItem[] {
    return field.optionsFrom ? (this.optionsCache[field.optionsFrom] ?? []) : [];
  }

  display(row: ReferenceRow, field: FieldDef): string {
    const value = row[field.key];
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (field.type === 'select' && field.optionsFrom) {
      const match = (this.optionsCache[field.optionsFrom] ?? []).find((o) => o.id === value);
      return match ? match.name : String(value);
    }
    return String(value);
  }

  immutableLabel(field: FieldDef): string {
    const value = this.model[field.key] ?? '';
    if (!value) {
      return '—';
    }
    if (field.optionsFrom) {
      const match = (this.optionsCache[field.optionsFrom] ?? []).find((o) => o.id === value);
      return match ? match.name : value;
    }
    return value;
  }

  openCreate(): void {
    this.editingId = null;
    this.model = {};
    this.error = '';
    this.formOpen = true;
  }

  openEdit(row: ReferenceRow): void {
    this.editingId = row.id;
    this.editIsActive = row.isActive;
    this.model = {};
    for (const field of this.entity.fields) {
      const value = row[field.key];
      this.model[field.key] = value === null || value === undefined ? '' : String(value);
    }
    this.error = '';
    this.formOpen = true;
  }

  cancel(): void {
    this.formOpen = false;
    this.error = '';
  }

  submit(): void {
    this.error = '';
    const body = this.buildBody();
    if (body === null) {
      this.error = 'Renseignez les champs obligatoires.';
      return;
    }

    this.busy = true;
    const request = this.editingId
      ? this.api.update(this.entity.segment, this.editingId, body)
      : this.api.create(this.entity.segment, body);

    request.subscribe({
      next: () => {
        this.busy = false;
        this.formOpen = false;
        this.reload();
      },
      error: (err) => {
        this.busy = false;
        this.error = this.messageOf(err);
      },
    });
  }

  deactivate(row: ReferenceRow): void {
    this.api.deactivate(this.entity.segment, row.id).subscribe({ next: () => this.reload() });
  }

  /** Construit le corps de requête ; renvoie null si un champ obligatoire manque. */
  private buildBody(): Record<string, unknown> | null {
    const body: Record<string, unknown> = {};
    for (const field of this.entity.fields) {
      // Le parent (immutableOnEdit) n'est envoyé qu'à la création.
      if (this.editingId && field.immutableOnEdit) {
        continue;
      }
      const raw = (this.model[field.key] ?? '').trim();
      if (!raw) {
        if (field.required) {
          return null;
        }
        continue;
      }
      if (field.type === 'number') {
        const num = Number(raw);
        if (Number.isNaN(num)) {
          return null;
        }
        body[field.key] = num;
      } else {
        body[field.key] = raw;
      }
    }
    if (this.editingId) {
      body['isActive'] = this.editIsActive;
    }
    return body;
  }

  private loadOptions(): void {
    for (const field of this.entity.fields) {
      const source = field.optionsFrom;
      if (source && !this.optionsCache[source]) {
        this.api.options(source).subscribe((items) => (this.optionsCache[source] = items));
      }
    }
  }

  private messageOf(err: unknown): string {
    const maybe = err as { error?: { message?: string | string[] } };
    const message = maybe.error?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    return message ?? "L'opération a échoué.";
  }
}
