import { Component, OnInit, inject } from '@angular/core';
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
  templateUrl: './users-admin.component.html',
  styleUrl: './users-admin.component.css',
})
export class UsersAdminComponent implements OnInit {
  private readonly api = inject(UsersAdminApi);

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

  constructor() {
    const auth = inject(AuthService);

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
