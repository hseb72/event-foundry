import { Component, OnInit } from '@angular/core';
import { UsersAdminApi } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { AdminUserDto } from '../../core/models';
import { DataColumn, DataTableComponent } from '../../shared/data-table.component';

const ROLES = ['USER', 'ADMIN'];

/** Administration des utilisateurs : rôles et activation (EPIC 12, réservé ADMIN). */
@Component({
  selector: 'app-users-admin',
  standalone: true,
  imports: [DataTableComponent],
  styles: [
    `
      .inactive td {
        opacity: 0.5;
      }
      .roles {
        display: flex;
        gap: 0.8rem;
      }
      .roles label {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.85rem;
      }
      .me {
        font-size: 0.72rem;
        color: var(--exp);
        font-weight: 700;
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
      .error {
        color: var(--red);
        font-size: 0.85rem;
        margin-top: 0.5rem;
      }
    `,
  ],
  template: `
    <h1>Utilisateurs</h1>
    <p class="muted">Gérez les rôles et l'activation des comptes.</p>

    @if (error) {
      <p class="error">{{ error }}</p>
    }

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else {
      <div class="card">
        <app-data-table
          [columns]="columns"
          [rows]="$any(users)"
          [cellTemplates]="{ user: userCell, roles: rolesCell, state: stateCell }"
          [rowActions]="actions"
          actionsLabel=""
          [pageSize]="15"
          searchPlaceholder="Rechercher un utilisateur…"
          [rowClass]="rowClassFn"
        />
        <ng-template #userCell let-user>
          <div>
            {{ user.displayName }}
            @if (user.id === currentId) {
              <span class="me">(vous)</span>
            }
          </div>
          <small class="muted">{{ user.email }}</small>
        </ng-template>
        <ng-template #rolesCell let-user>
          <div class="roles">
            @for (role of allRoles; track role) {
              <label>
                <input
                  type="checkbox"
                  [checked]="user.roles.includes(role)"
                  [disabled]="busyId === user.id"
                  (change)="toggleRole($any(user), role, isChecked($event))"
                />
                {{ role }}
              </label>
            }
          </div>
        </ng-template>
        <ng-template #stateCell let-user>
          <span class="pill" [class.on]="user.isActive" [class.off]="!user.isActive">
            {{ user.isActive ? 'Actif' : 'Suspendu' }}
          </span>
        </ng-template>
        <ng-template #actions let-user>
          <button
            class="btn"
            [disabled]="busyId === user.id || user.id === currentId"
            [title]="user.isActive ? 'Bloque la connexion ; les données sont conservées' : 'Restaure l’accès au compte'"
            (click)="toggleActive($any(user))"
          >
            {{ user.isActive ? 'Suspendre' : 'Réactiver' }}
          </button>
        </ng-template>
      </div>
    }
  `,
})
export class UsersAdminComponent implements OnInit {
  users: AdminUserDto[] = [];
  loading = true;
  busyId: string | null = null;
  error = '';
  readonly allRoles = ROLES;
  readonly currentId: string | null;

  readonly columns: DataColumn[] = [
    {
      key: 'user',
      label: 'Utilisateur',
      sortable: true,
      value: (r) => `${r['displayName'] ?? ''} ${r['email'] ?? ''}`.trim(),
      sortValue: (r) => String(r['displayName'] ?? ''),
      cellTemplate: 'user',
    },
    {
      key: 'roles',
      label: 'Rôles',
      sortable: true,
      value: (r) => ((r['roles'] as string[] | undefined) ?? []).join(', '),
      cellTemplate: 'roles',
    },
    {
      key: 'isActive',
      label: 'État',
      sortable: true,
      value: (r) => (r['isActive'] ? 'Actif' : 'Suspendu'),
      cellTemplate: 'state',
    },
  ];

  readonly rowClassFn = (row: Record<string, unknown>): Record<string, boolean> => ({
    inactive: !row['isActive'],
  });

  constructor(
    private readonly api: UsersAdminApi,
    auth: AuthService,
  ) {
    this.currentId = auth.userId();
  }

  ngOnInit(): void {
    this.reload();
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  toggleRole(user: AdminUserDto, role: string, checked: boolean): void {
    const set = new Set(user.roles);
    if (checked) {
      set.add(role);
    } else {
      set.delete(role);
    }
    const roles = [...set];
    if (roles.length === 0) {
      this.error = 'Un utilisateur doit conserver au moins un rôle.';
      this.reload();
      return;
    }
    this.mutate(user.id, this.api.setRoles(user.id, roles));
  }

  toggleActive(user: AdminUserDto): void {
    this.mutate(user.id, this.api.setStatus(user.id, !user.isActive));
  }

  private mutate(id: string, request: ReturnType<UsersAdminApi['setStatus']>): void {
    this.busyId = id;
    this.error = '';
    request.subscribe({
      next: (updated) => {
        this.users = this.users.map((u) => (u.id === updated.id ? updated : u));
        this.busyId = null;
      },
      error: (err) => {
        this.busyId = null;
        this.error = this.messageOf(err);
        this.reload();
      },
    });
  }

  private reload(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private messageOf(err: unknown): string {
    const maybe = err as { error?: { message?: string | string[] } };
    const message = maybe.error?.message;
    return Array.isArray(message) ? message.join(', ') : (message ?? "L'opération a échoué.");
  }
}
