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
  templateUrl: './organizations.component.html',
  styleUrl: './organizations.component.css',
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
