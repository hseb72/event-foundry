import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IdentityService } from '../../core/api/identity.service';
import { OperatorInvitation, OperatorInvitationsApi } from '../../core/api/operator-invitations.service';
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
  templateUrl: './operator-admin.component.html',
  styleUrl: './operator-admin.component.css',
})
export class OperatorAdminComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly usersApi = inject(UsersAdminApi);
  private readonly operatorInvites_api = inject(OperatorInvitationsApi);

  readonly operatorInvites = signal<OperatorInvitation[]>([]);
  inviteEmail = '';

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
    this.operatorInvites_api.pending().subscribe({ next: (i) => this.operatorInvites.set(i), error: () => {} });
  }

  inviteOperator(): void {
    this.operatorInvites_api.invite(this.inviteEmail.trim()).subscribe({
      next: () => {
        this.inviteEmail = '';
        this.ok('Invitation envoyée.');
        this.reload();
      },
      error: (e) => this.fail(e),
    });
  }

  resendOperator(id: string): void {
    this.operatorInvites_api.resend(id).subscribe({ next: () => this.ok('Invitation renvoyée.'), error: (e) => this.fail(e) });
  }

  cancelOperator(id: string): void {
    this.operatorInvites_api.cancel(id).subscribe({ next: () => this.reload(), error: (e) => this.fail(e) });
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
