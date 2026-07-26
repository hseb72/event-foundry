import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MyOrganization,
  OrgFunction,
  OrganizationGeneralInfo,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationsApi,
} from '../../core/api/organizations.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { ActivityDto } from '../../core/models';

/**
 * Gestion des organisations de l'utilisateur (FSPEC.19) : création, collaborateurs, fonctions,
 * départ et transfert de propriété. Les actions de gestion ne s'affichent que pour un Owner /
 * Administrator ; les garde-fous (dernier Owner) sont appliqués côté serveur.
 */
@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  styles: [
    `
      .grid { display: grid; gap: 1rem; }
      .row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
      .members { width: 100%; border-collapse: collapse; margin-top: 0.6rem; }
      .members th, .members td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 0.88rem; }
      .fn { font-size: 0.75rem; padding: 0.05rem 0.45rem; border-radius: 999px; background: rgba(255,255,255,0.1); }
      .muted { opacity: 0.75; font-size: 0.85rem; }
      select, input { }
      .danger { border-color: var(--red); color: var(--red); }
    `,
  ],
  template: `
    <div class="page">
      <h1>Mes organisations</h1>
      <p class="muted">Créez une organisation pour publier en équipe, ou gérez vos collaborateurs.</p>

      <section class="card">
        <h2>Créer une organisation</h2>
        <div class="row">
          <input class="input" [(ngModel)]="newName" placeholder="Nom de l'organisation" />
          <button class="btn btn-primary" (click)="create()" [disabled]="newName.trim().length < 2 || busy()">
            Créer
          </button>
        </div>
        <p class="muted" style="margin:0.4rem 0 0">Vous en deviendrez automatiquement le Owner.</p>
      </section>

      @for (org of orgs(); track org.id) {
        <section class="card grid">
          <div class="row" style="justify-content:space-between">
            <div>
              <strong>{{ org.name }}</strong>
              @for (fn of org.functions; track fn) { <span class="fn">{{ fnLabel(fn) }}</span> }
            </div>
            <div class="row">
              <button class="btn btn-sm" (click)="toggleConfig(org)">
                {{ configOrg() === org.id ? 'Masquer' : 'Configuration' }}
              </button>
              @if (canManage(org)) {
                <button class="btn btn-sm" (click)="toggleMembers(org.id)">
                  {{ expanded() === org.id ? 'Masquer' : 'Collaborateurs' }}
                </button>
              }
              <button class="btn btn-sm danger" (click)="leave(org)">Quitter</button>
            </div>
          </div>

          @if (configOrg() === org.id && info(); as gi) {
            <div class="grid" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:0.8rem">
              <h3 style="font-size:0.85rem;margin:0">Informations générales</h3>
              <div class="row"><label class="muted" style="width:120px">Nom</label>
                <input class="input" [(ngModel)]="gi.name" [disabled]="!canManage(org)" /></div>
              <div class="row"><label class="muted" style="width:120px">E-mail contact</label>
                <input class="input" [(ngModel)]="gi.contactEmail" [disabled]="!canManage(org)" placeholder="contact@..." /></div>
              <div class="row"><label class="muted" style="width:120px">Site / réseau</label>
                <input class="input" [(ngModel)]="gi.website" [disabled]="!canManage(org)" placeholder="https://..." /></div>
              <div class="row"><label class="muted" style="width:120px">Logo (URL)</label>
                <input class="input" [(ngModel)]="gi.logoUrl" [disabled]="!canManage(org)" placeholder="https://..." /></div>
              <div class="row"><label class="muted" style="width:120px">Description</label>
                <input class="input" [(ngModel)]="gi.description" [disabled]="!canManage(org)" /></div>
              <p class="muted" style="margin:0">Abonnement : {{ gi.subscriptionPlan?.name ?? 'Free' }}</p>
              @if (canManage(org)) {
                <div><button class="btn btn-sm" (click)="saveGeneral(org, gi)">Enregistrer les informations</button></div>
              }

              <h3 style="font-size:0.85rem;margin:0.6rem 0 0">Activités couvertes</h3>
              <div class="row">
                @for (a of activities(); track a.id) {
                  <button class="fn" [style.opacity]="selected().has(a.id) ? '1' : '0.5'"
                    [style.background]="selected().has(a.id) ? 'rgba(219,39,119,0.35)' : 'rgba(255,255,255,0.1)'"
                    [disabled]="!canManage(org)" (click)="toggleActivity(a.id)">{{ a.name }}</button>
                }
              </div>
              @if (canManage(org)) {
                <div><button class="btn btn-sm" (click)="saveActivities(org)">Enregistrer les activités</button></div>
              }
            </div>
          }

          @if (expanded() === org.id) {
            @if (members(); as list) {
              <table class="members">
                <thead>
                  <tr><th>Collaborateur</th><th>Fonction</th><th></th></tr>
                </thead>
                <tbody>
                  @for (m of list; track m.userId) {
                    <tr>
                      <td>{{ m.displayName }}<br /><span class="muted">{{ m.email }}</span>
                        @if (m.onboardingLevel < 1) {
                          <span class="fn" style="background:rgba(234,179,8,0.25)">Onboarding {{ (m.onboardingLevel * 100) | number: '1.0-0' }}%</span>
                        }
                      </td>
                      <td>
                        <select
                          [ngModel]="m.functions[0]"
                          (ngModelChange)="changeFunction(org, m, $event)"
                        >
                          <option value="Owner">Owner</option>
                          <option value="Administrator">Administrateur</option>
                          <option value="Event Manager">Responsable d'événements</option>
                        </select>
                      </td>
                      <td class="row">
                        @if (isOwner(org) && !m.functions.includes('Owner')) {
                          <button class="btn btn-sm" (click)="transfer(org, m)">Faire Owner</button>
                        }
                        <button class="btn btn-sm danger" (click)="remove(org, m)">Retirer</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }

            <h3 style="font-size:0.85rem;margin:1rem 0 0.4rem">Inviter un collaborateur</h3>
            <div class="row">
              <input class="input" [(ngModel)]="inviteEmail" placeholder="e-mail" type="email" />
              <select [(ngModel)]="inviteFunction">
                <option value="Event Manager">Responsable d'événements</option>
                <option value="Administrator">Administrateur</option>
                <option value="Owner">Owner</option>
              </select>
              <button class="btn btn-sm" (click)="invite(org)" [disabled]="!inviteEmail">Inviter</button>
            </div>

            @if (invitations(); as invs) {
              @if (invs.length) {
                <table class="members">
                  <thead><tr><th>Invitation en attente</th><th>Fonction</th><th></th></tr></thead>
                  <tbody>
                    @for (inv of invs; track inv.id) {
                      <tr>
                        <td>{{ inv.email }}</td>
                        <td><span class="fn">{{ fnLabel(inv.function) }}</span></td>
                        <td class="row">
                          <button class="btn btn-sm" (click)="resend(org, inv)">Renvoyer</button>
                          <button class="btn btn-sm danger" (click)="cancelInvite(org, inv)">Annuler</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            }
          }
        </section>
      } @empty {
        <p class="muted">Vous n'appartenez à aucune organisation pour le moment.</p>
      }

      @if (message()) { <p style="margin-top:0.6rem">{{ message() }}</p> }
    </div>
  `,
})
export class OrganizationsComponent implements OnInit {
  private readonly api = inject(OrganizationsApi);
  private readonly refData = inject(ReferenceDataApi);

  readonly configOrg = signal<string | null>(null);
  readonly info = signal<OrganizationGeneralInfo | null>(null);
  readonly activities = signal<ActivityDto[]>([]);
  readonly selected = signal<Set<string>>(new Set());

  readonly orgs = signal<MyOrganization[]>([]);
  readonly members = signal<OrganizationMember[] | null>(null);
  readonly invitations = signal<OrganizationInvitation[] | null>(null);
  readonly expanded = signal<string | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  newName = '';
  inviteEmail = '';
  inviteFunction: OrgFunction = 'Event Manager';

  private static readonly FN_LABELS: Record<string, string> = {
    Owner: 'Owner',
    Administrator: 'Administrateur',
    'Event Manager': "Responsable d'événements",
  };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.mine().subscribe((orgs) => this.orgs.set(orgs));
  }

  fnLabel(fn: string): string {
    return OrganizationsComponent.FN_LABELS[fn] ?? fn;
  }

  canManage(org: MyOrganization): boolean {
    return org.functions.some((f) => f === 'Owner' || f === 'Administrator');
  }

  isOwner(org: MyOrganization): boolean {
    return org.functions.includes('Owner');
  }

  create(): void {
    this.busy.set(true);
    this.api.create(this.newName.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.newName = '';
        this.message.set('✅ Organisation créée. Activez l’expérience Organizer pour la gérer.');
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.message.set(err?.error?.message ?? 'Création impossible.');
      },
    });
  }

  toggleMembers(id: string): void {
    if (this.expanded() === id) {
      this.expanded.set(null);
      return;
    }
    this.expanded.set(id);
    this.members.set(null);
    this.invitations.set(null);
    this.api.members(id).subscribe({
      next: (list) => this.members.set(list),
      error: (err) => this.message.set(err?.error?.message ?? 'Accès refusé.'),
    });
    this.loadInvitations(id);
  }

  private loadInvitations(id: string): void {
    this.api.invitations(id).subscribe({
      next: (list) => this.invitations.set(list),
      error: () => this.invitations.set([]),
    });
  }

  invite(org: MyOrganization): void {
    this.api.invite(org.id, this.inviteEmail.trim(), this.inviteFunction).subscribe({
      next: () => {
        this.message.set(`✅ Invitation envoyée à ${this.inviteEmail}.`);
        this.inviteEmail = '';
        this.loadInvitations(org.id);
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Invitation impossible.'),
    });
  }

  resend(org: MyOrganization, inv: OrganizationInvitation): void {
    this.api.resendInvitation(org.id, inv.id).subscribe({
      next: () => this.message.set(`Invitation renvoyée à ${inv.email}.`),
      error: (err) => this.message.set(err?.error?.message ?? 'Renvoi impossible.'),
    });
  }

  cancelInvite(org: MyOrganization, inv: OrganizationInvitation): void {
    this.api.cancelInvitation(org.id, inv.id).subscribe({
      next: () => this.loadInvitations(org.id),
      error: (err) => this.message.set(err?.error?.message ?? 'Annulation impossible.'),
    });
  }

  changeFunction(org: MyOrganization, member: OrganizationMember, fn: OrgFunction): void {
    if (member.functions[0] === fn) {
      return;
    }
    this.api.changeFunction(org.id, member.userId, fn).subscribe({
      next: () => this.toggleReload(org.id),
      error: (err) => this.message.set(err?.error?.message ?? 'Modification impossible.'),
    });
  }

  remove(org: MyOrganization, member: OrganizationMember): void {
    if (!confirm(`Retirer ${member.displayName} de ${org.name} ?`)) {
      return;
    }
    this.api.removeMember(org.id, member.userId).subscribe({
      next: () => this.toggleReload(org.id),
      error: (err) => this.message.set(err?.error?.message ?? 'Retrait impossible.'),
    });
  }

  transfer(org: MyOrganization, member: OrganizationMember): void {
    if (!confirm(`Transférer la propriété de ${org.name} à ${member.displayName} ? Vous deviendrez Administrateur.`)) {
      return;
    }
    this.api.transfer(org.id, member.userId).subscribe({
      next: () => {
        this.message.set('✅ Propriété transférée.');
        this.toggleReload(org.id);
        this.reload();
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Transfert impossible.'),
    });
  }

  leave(org: MyOrganization): void {
    if (!confirm(`Quitter ${org.name} ?`)) {
      return;
    }
    this.api.leave(org.id).subscribe({
      next: () => {
        this.message.set(`Vous avez quitté ${org.name}.`);
        this.reload();
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Départ impossible.'),
    });
  }

  private toggleReload(id: string): void {
    this.api.members(id).subscribe((list) => this.members.set(list));
    this.reload();
  }

  // --- Configuration (FSPEC.16) ---
  toggleConfig(org: MyOrganization): void {
    if (this.configOrg() === org.id) {
      this.configOrg.set(null);
      return;
    }
    this.configOrg.set(org.id);
    this.info.set(null);
    if (this.activities().length === 0) {
      this.refData.activities().subscribe((list) => this.activities.set(list));
    }
    this.api.generalInfo(org.id).subscribe({
      next: (gi) => {
        this.info.set(gi);
        this.selected.set(new Set(gi.coveredActivities.map((c) => c.activity.id)));
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Accès refusé.'),
    });
  }

  toggleActivity(id: string): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  saveGeneral(org: MyOrganization, gi: OrganizationGeneralInfo): void {
    this.api
      .updateGeneralInfo(org.id, {
        name: gi.name,
        contactEmail: gi.contactEmail ?? undefined,
        website: gi.website ?? undefined,
        logoUrl: gi.logoUrl ?? undefined,
        description: gi.description ?? undefined,
      })
      .subscribe({
        next: () => {
          this.message.set('✅ Informations enregistrées.');
          this.reload();
        },
        error: (err) => this.message.set(err?.error?.message ?? 'Enregistrement impossible.'),
      });
  }

  saveActivities(org: MyOrganization): void {
    this.api.setActivities(org.id, [...this.selected()]).subscribe({
      next: () => this.message.set('✅ Activités couvertes enregistrées.'),
      error: (err) => this.message.set(err?.error?.message ?? 'Enregistrement impossible.'),
    });
  }
}
