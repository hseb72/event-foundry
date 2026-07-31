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
import { IdentityService } from '../../core/api/identity.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import {
  AI_USE_CASES,
  ActivityDto,
  AiProviderInfo,
  AiUseCase,
  MunicipalityGeo,
  OrganizationAddress,
  ReferentialItem,
} from '../../core/models';

/**
 * Gestion des organisations de l'utilisateur (FSPEC.19) : création, collaborateurs, fonctions,
 * départ et transfert de propriété. Les actions de gestion ne s'affichent que pour un Owner /
 * Administrator ; les garde-fous (dernier Owner) sont appliqués côté serveur.
 *
 * La section « Configuration » porte **toute** la configuration rattachée à une organisation —
 * informations générales, activités couvertes, fiche organisateur, **adresses** et **IA de
 * l'organisation**. Ces réglages appartiennent à l'organisation, pas à l'utilisateur : ils n'ont
 * délibérément aucune place dans la configuration personnelle (page Identité).
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
      /* Tokens neutres uniquement (UISPEC.13) : les valeurs en dur supposaient un fond sombre et
         s'effaçaient en thème clair (séparateurs invisibles, pastilles blanches sur blanc). */
      .members th, .members td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
      .members th { color: var(--muted); font-weight: 600; }
      .fn { font-size: 0.75rem; padding: 0.05rem 0.45rem; border-radius: 999px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
      /* Bouton d'activité couverte : l'état sélectionné suit l'expérience active. */
      .activity { font-size: 0.75rem; padding: 0.1rem 0.55rem; border-radius: 999px; background: var(--surface-2); color: var(--text); border: 1px solid var(--border); cursor: pointer; }
      .activity.on { background: var(--exp); border-color: var(--exp); color: var(--exp-contrast, #fff); }
      .activity:disabled { cursor: not-allowed; opacity: 0.55; }
      .muted { color: var(--muted); font-size: 0.85rem; }
      select, input { }
      .danger { border-color: var(--red); color: var(--red); }
      .addr-item { border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.55rem 0.7rem; background: var(--surface-2); }
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
            <div class="grid" style="border-top:1px solid var(--border);padding-top:0.8rem">
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
                  <button type="button" class="activity" [class.on]="selected().has(a.id)"
                    [disabled]="!canManage(org)" (click)="toggleActivity(a.id)">{{ a.name }}</button>
                }
              </div>
              @if (canManage(org)) {
                <div><button class="btn btn-sm" (click)="saveActivities(org)">Enregistrer les activités</button></div>
              }

              <h3 style="font-size:0.85rem;margin:0.6rem 0 0">Fiche organisateur représentée</h3>
              <p class="muted" style="margin:0">
                Déclarez la fiche organisateur du référentiel que représente votre organisation : les
                utilisateurs qui enregistrent un événement privé vous mentionnant pourront vous en informer (FSPEC.22 §16).
              </p>
              <div class="row">
                <select class="input" [ngModel]="gi.organizerId ?? ''" (ngModelChange)="linkOrganizer(org, $event)" [disabled]="!canManage(org)">
                  <option value="">— Aucune —</option>
                  @for (o of organizers(); track o.id) {
                    <option [value]="o.id">{{ o.name }}</option>
                  }
                </select>
              </div>

              <h3 style="font-size:0.85rem;margin:0.6rem 0 0">Adresses de l'organisation</h3>
              <p class="muted" style="margin:0">
                Adresses de « {{ org.name }} ». Proposées comme localisation à la création d'un
                événement. La région est dérivée de la commune.
              </p>
              @for (a of addresses(); track a.id) {
                <div class="addr-item">
                  <div class="row" style="justify-content:space-between">
                    <strong>{{ a.label }}</strong>
                    @if (a.isPrimary) { <span class="fn">● principale</span> }
                  </div>
                  <div class="muted">
                    {{ a.streetLines }} · {{ a.postalCode }}
                    @if (a.municipalityName) { {{ a.municipalityName }} }
                    @if (a.regionName) { ({{ a.regionName }}) }
                    · {{ a.countryName }}
                  </div>
                  @if (canManage(org)) {
                    <div class="row" style="margin-top:0.4rem">
                      @if (!a.isPrimary) {
                        <button class="btn btn-sm" (click)="setPrimaryAddress(org.id, a.id)">Définir principale</button>
                      }
                      <button class="btn btn-sm danger" (click)="deleteAddress(org.id, a.id)">Supprimer</button>
                    </div>
                  }
                </div>
              } @empty {
                <p class="muted" style="margin:0">Aucune adresse enregistrée.</p>
              }
              @if (canManage(org)) {
                <div class="grid" style="gap:0.5rem">
                  <input class="input" [(ngModel)]="addr.label" placeholder="Libellé (ex. Boutique centre-ville)" />
                  <input class="input" [(ngModel)]="addr.streetLines" placeholder="Rue" />
                  <div class="row">
                    <select class="input" [(ngModel)]="addr.countryId" (ngModelChange)="onAddrCountryChange()">
                      <option value="">Pays…</option>
                      @for (c of countries; track c.id) {
                        <option [value]="c.id">{{ c.name }}</option>
                      }
                    </select>
                    <input class="input" [(ngModel)]="addr.postalCode" placeholder="Code postal"
                           [disabled]="!addr.countryId" (keyup.enter)="resolveAddr()" />
                    <button type="button" class="btn btn-sm" [disabled]="!addr.countryId || !addr.postalCode.trim()"
                            (click)="resolveAddr()">Résoudre</button>
                  </div>
                  @if (addrResolved.length) {
                    <select class="input" [(ngModel)]="addr.municipalityId">
                      <option value="">Commune…</option>
                      @for (mun of addrResolved; track mun.id) {
                        <option [value]="mun.id">{{ mun.name }} ({{ mun.regionName }})</option>
                      }
                    </select>
                  } @else if (addrPostalSearched) {
                    <p class="muted" style="margin:0">Aucune commune trouvée pour ce code postal.</p>
                  }
                  <label class="row" style="font-size:0.85rem">
                    <input type="checkbox" [(ngModel)]="addr.isPrimary" /> Adresse principale
                  </label>
                  <div>
                    <button class="btn btn-sm" [disabled]="!canSubmitAddr()" (click)="addAddress(org.id)">
                      Ajouter l'adresse
                    </button>
                  </div>
                </div>
              }

              <h3 style="font-size:0.85rem;margin:0.6rem 0 0">IA de l'organisation</h3>
              <p class="muted" style="margin:0">
                IA appliquée aux imports réalisés au nom de « {{ org.name }} ». Prioritaire sur l'IA
                personnelle de chaque collaborateur. La clé est stockée comme un secret, jamais réaffichée.
              </p>
              <div class="grid" style="gap:0.5rem">
                <label class="row" style="font-size:0.85rem">
                  <input type="checkbox" [(ngModel)]="orgAi.enabled" [disabled]="!canManage(org)" />
                  Activer l'IA de l'organisation
                </label>
                <div class="row">
                  <select class="input" [(ngModel)]="orgAi.provider" [disabled]="!canManage(org)">
                    <option value="">Fournisseur…</option>
                    @for (p of aiProviders; track p.id) {
                      <option [value]="p.id">{{ p.label }}</option>
                    }
                  </select>
                  <select class="input" [(ngModel)]="orgAi.model" [disabled]="!orgAi.provider || !canManage(org)">
                    <option value="">Modèle…</option>
                    @for (mo of modelsFor(orgAi.provider); track mo) {
                      <option [value]="mo">{{ mo }}</option>
                    }
                  </select>
                </div>
                @if (canManage(org)) {
                  <input class="input" type="password" [(ngModel)]="orgAi.apiKey"
                         [placeholder]="orgAiSecretMasked() ? 'Clé enregistrée (' + orgAiSecretMasked() + ') — laisser vide pour conserver' : 'Clé API'" />
                  @if (providerInfo(orgAi.provider); as pi) {
                    <p class="muted" style="margin:0">
                      @if (pi.requiresKey) {
                        Clé {{ pi.keyHint }}
                        @if (pi.keyUrl) {
                          — <a [href]="pi.keyUrl" target="_blank" rel="noopener" style="color:var(--exp)">obtenir une clé ↗</a>
                        }
                      } @else {
                        {{ pi.keyHint }}
                      }
                    </p>
                  }
                }
                <div class="row">
                  @for (uc of aiUseCases; track uc) {
                    <button type="button" class="activity" [class.on]="orgAi.useCases[uc]"
                            [disabled]="!canManage(org)" (click)="toggleOrgUseCase(uc)">{{ uc }}</button>
                  }
                </div>
                @if (canManage(org)) {
                  <div class="row">
                    <button class="btn btn-sm" (click)="saveOrgAi(org.id)">Enregistrer l'IA</button>
                    <button class="btn btn-sm" (click)="testOrgAi(org.id)" [disabled]="!orgAiSecretMasked()">Tester</button>
                    @if (orgAiStatus()) { <span class="muted">{{ aiStatusLabel(orgAiStatus()) }}</span> }
                  </div>
                }
              </div>
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
  private readonly identity = inject(IdentityService);
  private readonly aiConfigApi = inject(AiConfigApi);

  readonly configOrg = signal<string | null>(null);
  readonly info = signal<OrganizationGeneralInfo | null>(null);
  readonly activities = signal<ActivityDto[]>([]);
  readonly selected = signal<Set<string>>(new Set());
  readonly organizers = signal<{ id: string; name: string }[]>([]);

  // Adresses de l'organisation ouverte en configuration (rattachées à l'organisation, jamais à
  // l'utilisateur : elles n'ont pas leur place dans la configuration personnelle).
  readonly addresses = signal<OrganizationAddress[]>([]);
  countries: ReferentialItem[] = [];
  addrResolved: MunicipalityGeo[] = [];
  addrPostalSearched = false;
  addr = { label: '', countryId: '', postalCode: '', municipalityId: '', streetLines: '', isPrimary: false };

  // Configuration IA de portée ORGANIZATION (ADR.16) — distincte de l'IA personnelle.
  readonly aiUseCases = AI_USE_CASES;
  aiProviders: AiProviderInfo[] = [];
  private readonly orgAiSecret = signal<{ masked: string } | null>(null);
  private readonly orgAiTestStatus = signal<string>('');
  orgAi = {
    provider: '',
    model: '',
    enabled: false,
    useCases: {} as Record<string, boolean>,
    apiKey: '',
  };

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
      next: (org) => {
        this.newName = '';
        // L'organisation créée devient active par défaut : re-contextualise l'identité (jetons +
        // vue « moi ») pour que les menus Organizer complets apparaissent immédiatement (entonnoir).
        this.identity.switchOrganization(org.id).subscribe({
          next: () => {
            this.busy.set(false);
            this.message.set('✅ Organisation créée. Vous en êtes le Owner ; elle est désormais active.');
            this.reload();
          },
          error: () => {
            this.busy.set(false);
            this.message.set('✅ Organisation créée.');
            this.reload();
          },
        });
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
    if (this.organizers().length === 0) {
      this.refData.organizers().subscribe((list) => this.organizers.set(list));
    }
    this.api.generalInfo(org.id).subscribe({
      next: (gi) => {
        this.info.set(gi);
        this.selected.set(new Set(gi.coveredActivities.map((c) => c.activity.id)));
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Accès refusé.'),
    });
    this.loadAddresses(org.id);
    this.loadOrgAi(org.id);
  }

  // --- Adresses de l'organisation ---

  private loadAddresses(organizationId: string): void {
    this.addresses.set([]);
    this.resetAddrForm();
    if (!this.countries.length) {
      this.refData.countries().subscribe((items) => (this.countries = items));
    }
    this.identity.listOrganizationAddresses(organizationId).subscribe({
      next: (list) => this.addresses.set(list),
      error: () => this.addresses.set([]),
    });
  }

  private resetAddrForm(): void {
    this.addr = { label: '', countryId: '', postalCode: '', municipalityId: '', streetLines: '', isPrimary: false };
    this.addrResolved = [];
    this.addrPostalSearched = false;
  }

  onAddrCountryChange(): void {
    this.addr.postalCode = '';
    this.addr.municipalityId = '';
    this.addrResolved = [];
    this.addrPostalSearched = false;
  }

  /** La commune (et donc la région) est résolue depuis le code postal — jamais saisie librement. */
  resolveAddr(): void {
    const postalCode = this.addr.postalCode.trim();
    if (!this.addr.countryId || !postalCode) {
      return;
    }
    this.refData.resolveMunicipalities(this.addr.countryId, postalCode).subscribe((communes) => {
      this.addrResolved = communes;
      this.addrPostalSearched = true;
      this.addr.municipalityId = communes.length === 1 ? communes[0].id : '';
    });
  }

  canSubmitAddr(): boolean {
    return (
      this.addr.label.trim().length > 0 &&
      this.addr.streetLines.trim().length > 0 &&
      this.addr.countryId.length > 0 &&
      this.addr.postalCode.trim().length > 0
    );
  }

  addAddress(organizationId: string): void {
    if (!this.canSubmitAddr()) {
      return;
    }
    this.identity
      .createOrganizationAddress(organizationId, {
        label: this.addr.label.trim(),
        countryId: this.addr.countryId,
        postalCode: this.addr.postalCode.trim(),
        municipalityId: this.addr.municipalityId || undefined,
        streetLines: this.addr.streetLines.trim(),
        isPrimary: this.addr.isPrimary,
      })
      .subscribe({
        next: () => {
          this.message.set('✅ Adresse ajoutée.');
          this.loadAddresses(organizationId);
        },
        error: (err) => this.message.set(err?.error?.message ?? 'Ajout impossible.'),
      });
  }

  setPrimaryAddress(organizationId: string, addressId: string): void {
    this.identity
      .setPrimaryOrganizationAddress(organizationId, addressId)
      .subscribe({
        next: () => this.loadAddresses(organizationId),
        error: (err) => this.message.set(err?.error?.message ?? 'Mise à jour impossible.'),
      });
  }

  deleteAddress(organizationId: string, addressId: string): void {
    this.identity.deleteOrganizationAddress(organizationId, addressId).subscribe({
      next: () => this.loadAddresses(organizationId),
      error: (err) => this.message.set(err?.error?.message ?? 'Suppression impossible.'),
    });
  }

  // --- IA de l'organisation (portée ORGANIZATION) ---

  private loadOrgAi(organizationId: string): void {
    this.orgAi = { provider: '', model: '', enabled: false, useCases: {}, apiKey: '' };
    this.orgAiSecret.set(null);
    this.orgAiTestStatus.set('');
    if (!this.aiProviders.length) {
      this.aiConfigApi.providers().subscribe((providers) => (this.aiProviders = providers));
    }
    this.aiConfigApi.getOrg(organizationId).subscribe({
      next: (config) => {
        if (!config) {
          return;
        }
        this.orgAi.provider = config.provider;
        this.orgAi.model = config.model;
        this.orgAi.enabled = config.enabled;
        this.orgAi.useCases = { ...config.useCases };
        this.orgAiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.orgAiTestStatus.set(config.status);
      },
      error: () => undefined,
    });
  }

  providerInfo(id: string): AiProviderInfo | undefined {
    return this.aiProviders.find((p) => p.id === id);
  }

  modelsFor(id: string): string[] {
    return this.providerInfo(id)?.suggestedModels ?? [];
  }

  orgAiSecretMasked(): string {
    return this.orgAiSecret()?.masked ?? '';
  }

  orgAiStatus(): string {
    return this.orgAiTestStatus();
  }

  aiStatusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIGURED: 'Configuré (non testé)',
      TESTED: '✓ Testé',
      FAILED: '✗ Test échoué',
    };
    return map[status] ?? status;
  }

  toggleOrgUseCase(useCase: AiUseCase): void {
    this.orgAi.useCases = { ...this.orgAi.useCases, [useCase]: !this.orgAi.useCases[useCase] };
  }

  saveOrgAi(organizationId: string): void {
    this.aiConfigApi
      .updateOrg(organizationId, {
        provider: this.orgAi.provider.trim(),
        model: this.orgAi.model.trim(),
        enabled: this.orgAi.enabled,
        useCases: this.orgAi.useCases,
        apiKey: this.orgAi.apiKey.trim() || undefined,
      })
      .subscribe({
        next: (config) => {
          this.orgAi.apiKey = '';
          this.orgAiSecret.set(config.secret ? { masked: config.secret.masked } : null);
          this.orgAiTestStatus.set(config.status);
          this.message.set("✅ Configuration IA de l'organisation enregistrée.");
        },
        error: (err) => this.message.set(err?.error?.message ?? 'Enregistrement impossible.'),
      });
  }

  testOrgAi(organizationId: string): void {
    this.aiConfigApi.testOrg(organizationId).subscribe({
      next: (result) => this.orgAiTestStatus.set(result.status),
      error: () => this.orgAiTestStatus.set('FAILED'),
    });
  }

  toggleActivity(id: string): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  /** Déclare (ou retire, valeur vide) la fiche Organizer représentée par l'organisation (§16). */
  linkOrganizer(org: MyOrganization, organizerId: string): void {
    const value = organizerId || null;
    this.api.setOrganizerLink(org.id, value).subscribe({
      next: () => {
        this.info.update((gi) => (gi ? { ...gi, organizerId: value } : gi));
        this.message.set('✅ Fiche organisateur mise à jour.');
      },
      error: (err) => this.message.set(err?.error?.message ?? 'Mise à jour impossible.'),
    });
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
