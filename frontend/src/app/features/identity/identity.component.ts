import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountApi, SecurityEventDto } from '../../core/api/account.service';
import { IdentityService } from '../../core/api/identity.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { NotificationsApi } from '../../core/api/notifications.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';
import {
  AI_USE_CASES,
  AiProviderInfo,
  AiUseCase,
  Experience,
  NotificationPreferences,
  ThemePreference,
} from '../../core/models';
import { toInitials } from '../../shared/initials';
import { ExpandableCardComponent } from '../../shared/expandable-card.component';

interface PermissionGroup {
  group: string;
  keys: string[];
}

const EXPERIENCE_LABELS: Record<Experience, string> = {
  EXPLORER: 'Explorer',
  ORGANIZER: 'Organizer',
  OPERATOR: 'Operator',
};

const EXPERIENCE_COLORS: Record<Experience, string> = {
  EXPLORER: 'var(--explorer)',
  ORGANIZER: 'var(--organizer)',
  OPERATOR: 'var(--operator)',
};

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [FormsModule, DatePipe, ExpandableCardComponent],
  templateUrl: './identity.component.html',
  styleUrl: './identity.component.css',
})
export class IdentityComponent implements OnInit {
  /** Onglets de la configuration, dans l'ordre d'affichage. */
  readonly tabs = [
    { key: 'personal', label: 'Personnel' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'ui', label: 'Préférences UI' },
    { key: 'ai', label: 'Utilisation IA' },
    { key: 'roles', label: 'Rôles & permissions' },
    { key: 'orgs', label: 'Organisations' },
  ] as const;
  readonly tab = signal<'personal' | 'notifications' | 'ui' | 'ai' | 'roles' | 'orgs'>('personal');

  /** Méthodes de second facteur. Seule l'application d'authentification est disponible à ce jour. */
  readonly mfaMethods = [
    { value: 'totp', label: 'Application d’authentification', available: true },
    { value: 'email', label: 'Code par e-mail', available: false },
    { value: 'push', label: 'Code en push', available: false },
  ];
  mfaMethod = 'totp';

  /** Pistes de fréquence réglables (le vecteur in-app est toujours actif, non réglable). */
  readonly frequencyTracks = [
    { value: 'immediate' as const, label: 'Alertes immédiates', frequency: 'Immédiate' },
    { value: 'daily' as const, label: 'Récapitulatif quotidien', frequency: 'Quotidienne' },
    { value: 'weekly' as const, label: 'Récapitulatif hebdomadaire', frequency: 'Hebdomadaire' },
  ];
  readonly vectorOptions = [
    { value: 'none', label: 'Aucune' },
    { value: 'email', label: 'E-mail' },
    { value: 'push', label: 'Push' },
  ];
  /** Préférences de notification servies par l'API (jamais dérivées du blob de préférences UI). */
  readonly notifPrefs = signal<NotificationPreferences | null>(null);
  private readonly identity = inject(IdentityService);
  private readonly aiConfigApi = inject(AiConfigApi);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationsApi = inject(NotificationsApi);

  // Configuration IA personnelle (ADR.16 / TSPEC.07).
  readonly aiUseCases = AI_USE_CASES;
  aiProviders: AiProviderInfo[] = [];
  private readonly aiSecret = signal<{ masked: string } | null>(null);
  private readonly aiTestStatus = signal<string>('');
  ai = {
    provider: '',
    model: '',
    enabled: false,
    useCases: {} as Record<string, boolean>,
    apiKey: '',
  };

  // Adresses et IA **de l'organisation** ne vivent pas ici : ce sont des réglages rattachés à une
  // organisation, gérés dans « Mes organisations » → Configuration (FSPEC.19 / ADR.16).

  readonly allExperiences: Experience[] = ['EXPLORER', 'ORGANIZER', 'OPERATOR'];
  readonly me = this.identity.me;

  readonly themePreference = this.theme.preference;
  readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Système' },
  ];

  readonly initials = computed(() => toInitials(this.me()?.displayName || this.me()?.email || ''));

  readonly editing = signal(false);
  draftName = '';

  readonly permissionGroups = computed<PermissionGroup[]>(() => {
    const permissions = this.me()?.permissions ?? [];
    const byGroup = new Map<string, string[]>();
    for (const key of permissions) {
      const group = key.includes('.') ? key.split('.')[0] : 'autre';
      byGroup.set(group, [...(byGroup.get(group) ?? []), key]);
    }
    return [...byGroup.entries()]
      .map(([group, keys]) => ({ group, keys }))
      .sort((a, b) => a.group.localeCompare(b.group));
  });

  ngOnInit(): void {
    if (!this.me()) {
      this.identity.loadMe().subscribe();
    }
    this.loadAiConfig();
    this.loadMfa();
    this.notificationsApi.getPreferences().subscribe((prefs) => this.notifPrefs.set(prefs));
  }

  // --- Configuration IA personnelle (ADR.16 / TSPEC.07) ---

  providerInfo(id: string): AiProviderInfo | undefined {
    return this.aiProviders.find((p) => p.id === id);
  }

  modelsFor(id: string): string[] {
    return this.providerInfo(id)?.suggestedModels ?? [];
  }

  private loadAiConfig(): void {
    if (!this.aiProviders.length) {
      this.aiConfigApi.providers().subscribe((providers) => (this.aiProviders = providers));
    }
    this.aiConfigApi.get().subscribe((config) => {
      if (config) {
        this.ai.provider = config.provider;
        this.ai.model = config.model;
        this.ai.enabled = config.enabled;
        this.ai.useCases = { ...config.useCases };
        this.aiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.aiTestStatus.set(config.status);
      }
    });
  }

  aiSecretMasked(): string {
    return this.aiSecret()?.masked ?? '';
  }

  aiStatus(): string {
    return this.aiTestStatus();
  }

  aiStatusLabel(): string {
    return this.aiStatusLabelOf(this.aiTestStatus());
  }

  aiStatusLabelOf(status: string): string {
    const map: Record<string, string> = {
      CONFIGURED: 'Configuré (non testé)',
      TESTED: '✓ Testé',
      FAILED: '✗ Test échoué',
    };
    return map[status] ?? status;
  }

  toggleUseCase(useCase: AiUseCase): void {
    this.ai.useCases = { ...this.ai.useCases, [useCase]: !this.ai.useCases[useCase] };
  }

  saveAi(): void {
    this.aiConfigApi
      .update({
        provider: this.ai.provider.trim(),
        model: this.ai.model.trim(),
        enabled: this.ai.enabled,
        useCases: this.ai.useCases,
        apiKey: this.ai.apiKey.trim() || undefined,
      })
      .subscribe((config) => {
        this.ai.apiKey = '';
        this.aiSecret.set(config.secret ? { masked: config.secret.masked } : null);
        this.aiTestStatus.set(config.status);
      });
  }

  testAi(): void {
    this.aiConfigApi.test().subscribe((result) => this.aiTestStatus.set(result.status));
  }

  label(experience: Experience): string {
    return EXPERIENCE_LABELS[experience];
  }

  color(experience: Experience): string {
    return EXPERIENCE_COLORS[experience];
  }

  activate(organizationId: string): void {
    this.identity.switchOrganization(organizationId).subscribe();
  }

  startEdit(currentName: string): void {
    this.draftName = currentName;
    this.editing.set(true);
  }

  saveProfile(): void {
    const displayName = this.draftName.trim();
    if (!displayName) {
      return;
    }
    this.identity.updateProfile({ displayName }).subscribe(() => this.editing.set(false));
  }

  // --- Sécurité du compte (FSPEC.18) ---
  pwdCurrent = '';
  pwdNew = '';
  emailPwd = '';
  emailNew = '';
  readonly securityMsg = signal('');
  private readonly account = inject(AccountApi);

  changePassword(): void {
    this.account.changePassword(this.pwdCurrent, this.pwdNew).subscribe({
      next: () => {
        this.pwdCurrent = '';
        this.pwdNew = '';
        this.securityMsg.set('✅ Mot de passe modifié.');
      },
      error: (err) =>
        this.securityMsg.set(err?.error?.message ?? 'Échec du changement de mot de passe.'),
    });
  }

  requestEmailChange(): void {
    this.account.requestEmailChange(this.emailPwd, this.emailNew).subscribe({
      next: () => {
        this.securityMsg.set(`✅ Lien de confirmation envoyé à ${this.emailNew}.`);
        this.emailPwd = '';
        this.emailNew = '';
      },
      error: (err) =>
        this.securityMsg.set(err?.error?.message ?? "Échec de la demande de changement d'adresse."),
    });
  }

  // --- MFA (FSPEC.18 §MFA) ---
  readonly mfaEnabled = signal(false);
  readonly mfaSecret = signal('');
  readonly mfaRecovery = signal<string[]>([]);
  mfaCode = '';
  mfaDisablePwd = '';

  private loadMfa(): void {
    this.account.mfaStatus().subscribe((s) => this.mfaEnabled.set(s.enabled));
  }

  setupMfa(): void {
    this.account.mfaSetup().subscribe((r) => this.mfaSecret.set(r.secret));
  }

  enableMfa(): void {
    this.account.mfaEnable(this.mfaCode).subscribe({
      next: (r) => {
        this.mfaSecret.set('');
        this.mfaCode = '';
        this.mfaRecovery.set(r.recoveryCodes);
        this.mfaEnabled.set(true);
      },
      error: (err) => this.securityMsg.set(err?.error?.message ?? 'Code invalide.'),
    });
  }

  disableMfa(): void {
    this.account.mfaDisable(this.mfaDisablePwd).subscribe({
      next: () => {
        this.mfaEnabled.set(false);
        this.mfaRecovery.set([]);
        this.mfaDisablePwd = '';
        this.securityMsg.set('2FA désactivée.');
      },
      error: (err) => this.securityMsg.set(err?.error?.message ?? 'Échec de la désactivation.'),
    });
  }

  // --- Mode organisateur autonome (self-service) ---
  readonly organizerBusy = signal(false);
  readonly organizerMsg = signal('');
  /** L'utilisateur a-t-il le rôle organisateur autonome ? (indépendant d'une appartenance à une org). */
  readonly isOrganizer = computed(() => (this.me()?.roles ?? []).includes('Organisateur autonome'));

  toggleOrganizer(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.organizerBusy.set(true);
    this.organizerMsg.set('');
    this.identity.setOrganizerMode(enabled).subscribe({
      next: () => {
        this.organizerBusy.set(false);
        this.organizerMsg.set(
          enabled
            ? '✅ Mode organisateur activé — l\'expérience Organizer est disponible dans la barre latérale.'
            : 'Mode organisateur désactivé.',
        );
      },
      error: (err) => {
        this.organizerBusy.set(false);
        this.organizerMsg.set(err?.error?.message ?? 'Action impossible pour le moment.');
      },
    });
  }

  // --- Données personnelles / RGPD (FSPEC.18 §14) ---
  readonly rgpdBusy = signal(false);
  readonly rgpdMsg = signal('');
  readonly securityEvents = signal<SecurityEventDto[] | null>(null);
  deletePwd = '';

  private static readonly SECURITY_LABELS: Record<string, string> = {
    'account.created': 'Création du compte',
    'account.email_verified': 'Adresse e-mail vérifiée',
    'account.email_verification_sent': 'Lien de vérification envoyé',
    'auth.login_succeeded': 'Connexion réussie',
    'auth.login_failed': 'Échec de connexion',
    'account.password_changed': 'Mot de passe changé',
    'account.password_reset_requested': 'Récupération demandée',
    'account.password_reset_completed': 'Mot de passe réinitialisé',
    'account.email_change_requested': "Changement d'adresse demandé",
    'account.email_changed': "Adresse e-mail changée",
    'account.suspended': 'Compte suspendu',
    'account.reactivated': 'Compte réactivé',
    'account.data_exported': 'Export de données',
    'account.deleted': 'Suppression du compte',
  };

  securityLabel(type: string): string {
    return IdentityComponent.SECURITY_LABELS[type] ?? type;
  }

  exportData(): void {
    this.rgpdBusy.set(true);
    this.account.exportData().subscribe({
      next: (data) => {
        this.rgpdBusy.set(false);
        // Téléchargement d'un fichier JSON local (aucune donnée n'est envoyée à un tiers).
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'eventfoundry-mes-donnees.json';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set('Export impossible pour le moment.');
      },
    });
  }

  loadSecurityEvents(): void {
    this.rgpdBusy.set(true);
    this.account.securityEvents().subscribe({
      next: (events) => {
        this.rgpdBusy.set(false);
        this.securityEvents.set(events);
      },
      error: () => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set('Journal indisponible pour le moment.');
      },
    });
  }

  deleteAccount(): void {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) {
      return;
    }
    this.rgpdBusy.set(true);
    this.account.deleteAccount(this.deletePwd).subscribe({
      next: () => {
        // Compte anonymisé : on ferme la session et on renvoie vers la vitrine publique.
        this.auth.logout();
        void this.router.navigate(['/welcome']);
      },
      error: (err) => {
        this.rgpdBusy.set(false);
        this.rgpdMsg.set(err?.error?.message ?? 'Suppression impossible (mot de passe incorrect ?).');
      },
    });
  }

  /** État courant d'un vecteur de notification (lu depuis les préférences renvoyées par /me). */
  /** Vecteur courant d'une piste de fréquence (préférences servies par l'API notifications). */
  vectorFor(track: 'immediate' | 'daily' | 'weekly'): string {
    return this.notifPrefs()?.[track] ?? 'none';
  }

  /**
   * Change le vecteur d'une piste. Les préférences sont **persistées côté serveur** (FSPEC.04) :
   * l'in-app reste toujours actif et n'est pas réglable ici.
   */
  setVector(track: 'immediate' | 'daily' | 'weekly', vector: string): void {
    const current = this.notifPrefs() ?? { immediate: 'none', daily: 'none', weekly: 'none' };
    const next = { ...current, [track]: vector } as NotificationPreferences;
    this.notifPrefs.set(next);
    this.notificationsApi.updatePreferences(next).subscribe({
      next: (saved) => this.notifPrefs.set(saved),
    });
  }

  /**
   * Autorise (ou non) l'IA pour un cas d'usage. Une seule configuration IA existe aujourd'hui :
   * le choix se limite donc à « Aucune » ou « Mon IA ».
   */
  setUseCase(useCase: AiUseCase, choice: string): void {
    this.ai.useCases[useCase] = choice === 'mine';
  }

  setTheme(preference: ThemePreference): void {
    // Application immédiate (rendu) + persistance dans les préférences (User Preferences, ADR.20).
    this.theme.set(preference);
    const preferences = { ...(this.me()?.preferences ?? {}), theme: preference };
    this.identity.updateProfile({ preferences }).subscribe();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/welcome']);
  }
}
