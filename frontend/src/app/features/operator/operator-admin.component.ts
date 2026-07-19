import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IdentityService } from '../../core/api/identity.service';
import { UsersAdminApi } from '../../core/api/users.service';
import { AdminUserDto, OrganizationAdmin } from '../../core/models';

// Rôles affectables depuis l'admin. Le Backend valide portée et existence ; ces listes ne sont
// qu'un confort d'UI (un endpoint référentiel des rôles pourra les alimenter ultérieurement).
const PLATFORM_ROLES = ['Explorer', 'Platform Operator', 'Customer Success', 'Finance'];
const ORGANIZATION_ROLE = 'Organizer';

@Component({
  selector: 'app-operator-admin',
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      h1 {
        margin-bottom: 1.25rem;
      }
      .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 1rem;
        align-items: start;
      }
      .card h2 {
        font-size: 1rem;
        margin: 0 0 0.85rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }
      th,
      td {
        text-align: left;
        padding: 0.45rem 0.4rem;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      th {
        color: var(--muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .row-form {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: end;
        margin-bottom: 0.9rem;
      }
      .row-form .field {
        display: grid;
        gap: 0.2rem;
      }
      .row-form label {
        font-size: 0.72rem;
        color: var(--muted);
      }
      .row-form .input,
      .row-form .select {
        min-width: 140px;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.12rem 0.45rem;
        margin: 0.1rem 0.15rem 0.1rem 0;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .chip button {
        border: 0;
        background: transparent;
        color: var(--muted);
        padding: 0;
        line-height: 1;
        font-size: 0.9rem;
      }
      .chip button:hover {
        color: var(--red);
      }
      .msg {
        margin: 0.75rem 0;
        font-size: 0.85rem;
      }
      .msg.err {
        color: var(--red);
      }
      .msg.ok {
        color: var(--green);
      }
      .btn-sm {
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
      }
    `,
  ],
  template: `
    <h1>Administration — Identité</h1>

    @if (message()) {
      <div class="msg" [class.err]="isError()" [class.ok]="!isError()">{{ message() }}</div>
    }

    <div class="cols">
      <section class="card">
        <h2>Organisations</h2>

        <div class="row-form">
          <div class="field">
            <label for="orgName">Nom</label>
            <input id="orgName" class="input" [(ngModel)]="newOrgName" placeholder="Ma boutique" />
          </div>
          <div class="field">
            <label for="orgSlug">Slug</label>
            <input id="orgSlug" class="input" [(ngModel)]="newOrgSlug" placeholder="ma-boutique" />
          </div>
          <button class="btn btn-primary btn-sm" (click)="createOrg()">Créer</button>
        </div>

        <table>
          <thead>
            <tr><th>Nom</th><th>Slug</th><th>Offre</th><th>Membres</th></tr>
          </thead>
          <tbody>
            @for (org of orgs(); track org.id) {
              <tr>
                <td>{{ org.name }}</td>
                <td class="muted">{{ org.slug }}</td>
                <td>{{ org.subscription ?? '—' }}</td>
                <td>{{ org.memberCount }}</td>
              </tr>
            }
            @if (!orgs().length) {
              <tr><td colspan="4" class="muted">Aucune organisation.</td></tr>
            }
          </tbody>
        </table>

        <h2 style="margin-top:1.25rem">Ajouter un membre (Organizer)</h2>
        <div class="row-form">
          <div class="field">
            <label for="mOrg">Organisation</label>
            <select id="mOrg" class="select" [(ngModel)]="memberOrgId">
              <option value="">—</option>
              @for (org of orgs(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="mUser">Utilisateur</label>
            <select id="mUser" class="select" [(ngModel)]="memberUserId">
              <option value="">—</option>
              @for (user of users(); track user.id) {
                <option [value]="user.id">{{ user.email }}</option>
              }
            </select>
          </div>
          <button class="btn btn-sm" (click)="addMember()">Rattacher</button>
        </div>
      </section>

      <section class="card">
        <h2>Rôles plateforme</h2>
        <table>
          <thead>
            <tr><th>Utilisateur</th><th>Rôles</th><th>Affecter</th></tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td>{{ user.email }}</td>
                <td>
                  @for (role of user.roles; track role) {
                    <span class="chip">
                      {{ role }}
                      <button title="Révoquer" (click)="revoke(user.id, role)">×</button>
                    </span>
                  }
                </td>
                <td>
                  <div class="row-form" style="margin:0">
                    <select class="select" [(ngModel)]="assignSelection[user.id]">
                      <option value="">—</option>
                      @for (role of platformRoles; track role) {
                        <option [value]="role">{{ role }}</option>
                      }
                    </select>
                    <button class="btn btn-sm" (click)="assign(user.id)">Affecter</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </div>
  `,
})
export class OperatorAdminComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly usersApi = inject(UsersAdminApi);

  readonly orgs = signal<OrganizationAdmin[]>([]);
  readonly users = signal<AdminUserDto[]>([]);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);

  readonly platformRoles = PLATFORM_ROLES;

  newOrgName = '';
  newOrgSlug = '';
  memberOrgId = '';
  memberUserId = '';
  assignSelection: Record<string, string> = {};

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.identity.listOrganizations().subscribe({ next: (o) => this.orgs.set(o), error: (e) => this.fail(e) });
    this.usersApi.list().subscribe({ next: (u) => this.users.set(u), error: (e) => this.fail(e) });
  }

  createOrg(): void {
    if (!this.newOrgName || !this.newOrgSlug) {
      return;
    }
    this.identity.createOrganization(this.newOrgName, this.newOrgSlug).subscribe({
      next: () => {
        this.ok(`Organisation « ${this.newOrgName} » créée.`);
        this.newOrgName = '';
        this.newOrgSlug = '';
        this.reload();
      },
      error: (e) => this.fail(e),
    });
  }

  addMember(): void {
    if (!this.memberOrgId || !this.memberUserId) {
      return;
    }
    this.identity.addMember(this.memberOrgId, this.memberUserId, ORGANIZATION_ROLE).subscribe({
      next: () => {
        this.ok('Membre rattaché comme Organizer.');
        this.memberUserId = '';
        this.reload();
      },
      error: (e) => this.fail(e),
    });
  }

  assign(userId: string): void {
    const role = this.assignSelection[userId];
    if (!role) {
      return;
    }
    this.identity.assignRole(userId, role).subscribe({
      next: () => {
        this.ok(`Rôle « ${role} » affecté.`);
        this.assignSelection[userId] = '';
        this.reload();
      },
      error: (e) => this.fail(e),
    });
  }

  revoke(userId: string, role: string): void {
    this.identity.revokeRole(userId, role).subscribe({
      next: () => {
        this.ok(`Rôle « ${role} » révoqué.`);
        this.reload();
      },
      error: (e) => this.fail(e),
    });
  }

  private ok(text: string): void {
    this.message.set(text);
    this.isError.set(false);
  }

  private fail(error: unknown): void {
    const text = error instanceof HttpErrorResponse ? (error.error?.message ?? error.message) : 'Erreur inattendue.';
    this.message.set(Array.isArray(text) ? text.join(', ') : String(text));
    this.isError.set(true);
  }
}
