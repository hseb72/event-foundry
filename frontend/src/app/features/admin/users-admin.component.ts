import { Component, OnInit } from '@angular/core';
import { UsersAdminApi } from '../../core/api/users.service';
import { AuthService } from '../../core/auth/auth.service';
import { AdminUserDto } from '../../core/models';

const ROLES = ['USER', 'ADMIN'];

/** Administration des utilisateurs : rôles et activation (EPIC 12, réservé ADMIN). */
@Component({
  selector: 'app-users-admin',
  standalone: true,
  styles: [
    `
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
        vertical-align: middle;
      }
      th {
        color: var(--muted);
        font-weight: 600;
      }
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
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôles</th>
              <th>État</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr [class.inactive]="!user.isActive">
                <td>
                  <div>
                    {{ user.displayName }}
                    @if (user.id === currentId) {
                      <span class="me">(vous)</span>
                    }
                  </div>
                  <small class="muted">{{ user.email }}</small>
                </td>
                <td>
                  <div class="roles">
                    @for (role of allRoles; track role) {
                      <label>
                        <input
                          type="checkbox"
                          [checked]="user.roles.includes(role)"
                          [disabled]="busyId === user.id"
                          (change)="toggleRole(user, role, isChecked($event))"
                        />
                        {{ role }}
                      </label>
                    }
                  </div>
                </td>
                <td>
                  <span class="pill" [class.on]="user.isActive" [class.off]="!user.isActive">
                    {{ user.isActive ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn"
                    [disabled]="busyId === user.id || user.id === currentId"
                    (click)="toggleActive(user)"
                  >
                    {{ user.isActive ? 'Désactiver' : 'Activer' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
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
