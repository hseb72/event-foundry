import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminReferenceApi, ReferenceRow } from '../../core/api/admin-reference.service';
import { ReferentialItem } from '../../core/models';
import { EntityDef, FieldDef } from './reference-admin.model';

/**
 * CRUD générique d'un référentiel, piloté par un `EntityDef`. Liste (inactifs inclus),
 * création, édition (nom + activation + champs mutables) et désactivation logique.
 */
@Component({
  selector: 'app-reference-crud',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 0.55rem 0.6rem;
        border-bottom: 1px solid var(--border);
        font-size: 0.92rem;
      }
      th {
        color: var(--muted);
        font-weight: 600;
      }
      .inactive td {
        opacity: 0.5;
      }
      .row-actions {
        display: flex;
        gap: 0.4rem;
      }
      .pill {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
      }
      .pill.on {
        background: rgba(22, 163, 74, 0.14);
        color: #157f3b;
      }
      .pill.off {
        background: rgba(0, 0, 0, 0.08);
        color: var(--muted);
      }
      form {
        display: grid;
        gap: 0.8rem;
        max-width: 560px;
        margin-top: 1rem;
      }
      label {
        display: block;
        font-weight: 600;
        font-size: 0.85rem;
        margin-bottom: 0.3rem;
      }
      .req::after {
        content: ' *';
        color: var(--red);
      }
      .form-actions {
        display: flex;
        gap: 0.6rem;
      }
      .error {
        color: var(--red);
        font-size: 0.85rem;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    `,
  ],
  template: `
    <div class="bar">
      <h2 style="margin:0">{{ entity.label }}</h2>
      @if (!formOpen) {
        <button class="btn btn-primary" (click)="openCreate()">+ {{ entity.singular }}</button>
      }
    </div>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else {
      <table>
        <thead>
          <tr>
            @for (f of entity.fields; track f.key) {
              <th>{{ f.label }}</th>
            }
            <th>État</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.id) {
            <tr [class.inactive]="!row.isActive">
              @for (f of entity.fields; track f.key) {
                <td>{{ display(row, f) }}</td>
              }
              <td>
                <span class="pill" [class.on]="row.isActive" [class.off]="!row.isActive">
                  {{ row.isActive ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="btn" (click)="openEdit(row)">Éditer</button>
                  @if (row.isActive) {
                    <button class="btn" (click)="deactivate(row)">Désactiver</button>
                  }
                </div>
              </td>
            </tr>
          }
          @if (rows.length === 0) {
            <tr>
              <td [attr.colspan]="entity.fields.length + 2" class="muted">Aucune entrée.</td>
            </tr>
          }
        </tbody>
      </table>
    }

    @if (formOpen) {
      <form (ngSubmit)="submit()">
        <h3 style="margin:0">
          {{ editingId ? 'Éditer' : 'Nouveau' }} — {{ entity.singular }}
        </h3>

        @for (f of entity.fields; track f.key) {
          @if (!(editingId && f.immutableOnEdit)) {
            <div>
              <label [class.req]="f.required">{{ f.label }}</label>
              @if (f.type === 'select') {
                <select
                  class="select"
                  [ngModel]="model[f.key]"
                  (ngModelChange)="model[f.key] = $event"
                  [name]="f.key"
                >
                  <option value="">— {{ f.required ? 'choisir' : 'aucun' }} —</option>
                  @for (opt of optionsFor(f); track opt.id) {
                    <option [value]="opt.id">{{ opt.name }}</option>
                  }
                </select>
              } @else {
                <input
                  class="input"
                  [type]="f.type === 'number' ? 'number' : 'text'"
                  [ngModel]="model[f.key]"
                  (ngModelChange)="model[f.key] = $event"
                  [name]="f.key"
                />
              }
            </div>
          } @else {
            <div>
              <label>{{ f.label }}</label>
              <input class="input" [value]="immutableLabel(f)" disabled />
            </div>
          }
        }

        @if (editingId) {
          <div class="check">
            <input type="checkbox" id="active" [(ngModel)]="editIsActive" name="isActive" />
            <label for="active" style="margin:0">Actif</label>
          </div>
        }

        @if (error) {
          <p class="error">{{ error }}</p>
        }

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="busy">Enregistrer</button>
          <button type="button" class="btn" [disabled]="busy" (click)="cancel()">Annuler</button>
        </div>
      </form>
    }
  `,
})
export class ReferenceCrudComponent implements OnChanges {
  @Input({ required: true }) entity!: EntityDef;

  rows: ReferenceRow[] = [];
  loading = false;
  formOpen = false;
  busy = false;
  error = '';

  editingId: string | null = null;
  editIsActive = true;
  model: Record<string, string> = {};

  private readonly optionsCache: Record<string, ReferentialItem[]> = {};

  constructor(private readonly api: AdminReferenceApi) {}

  ngOnChanges(): void {
    this.formOpen = false;
    this.error = '';
    this.loadOptions();
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.api.list(this.entity.segment).subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

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
