import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccountApi, OnboardingState } from '../core/api/account.service';
import { IdentityService } from '../core/api/identity.service';
import { NotificationsApi } from '../core/api/notifications.service';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme.service';
import { Experience } from '../core/models';
import { toInitials } from '../shared/initials';
import { LogoComponent } from '../shared/logo.component';

interface ExperienceMeta {
  key: Experience;
  label: string;
  color: string;
}

interface NavItem {
  label: string;
  path: string;
  experiences: Experience[];
  permission?: string;
  /**
   * Menu conditionné à l'appartenance à au moins une organisation. Tant que l'utilisateur n'est
   * affilié à aucune organisation (ni n'a créé la sienne), seul « Organisations » reste visible dans
   * l'expérience Organizer — l'entonnoir invite d'abord à créer / rejoindre une organisation.
   */
  requiresOrganization?: boolean;
}

const EXPERIENCES: ExperienceMeta[] = [
  { key: 'EXPLORER', label: 'Explorer', color: 'var(--explorer)' },
  { key: 'ORGANIZER', label: 'Organizer', color: 'var(--organizer)' },
  { key: 'OPERATOR', label: 'Operator', color: 'var(--operator)' },
];

// Navigation pilotée par l'EXPÉRIENCE active ET conditionnée par les PERMISSIONS (ADR.08/ADR.11) :
// changer d'expérience change les écrans proposés, sans jamais changer les droits.
const NAV: NavItem[] = [
  { label: 'Accueil', path: '/home', experiences: ['EXPLORER'], permission: 'catalog.read' },
  { label: 'Découvrir', path: '/discover', experiences: ['EXPLORER'], permission: 'catalog.read' },
  { label: 'Rechercher', path: '/search', experiences: ['EXPLORER'], permission: 'catalog.read' },
  { label: 'Pour vous', path: '/recommendations', experiences: ['EXPLORER'], permission: 'recommendation.view' },
  { label: 'Mon planning', path: '/calendar', experiences: ['EXPLORER'], permission: 'planning.manage' },
  { label: 'Mes événements privés', path: '/my-events', experiences: ['EXPLORER'], permission: 'planning.manage' },
  { label: 'Mes suivis', path: '/follows', experiences: ['EXPLORER'] },
  { label: 'Aide & demandes', path: '/support', experiences: ['EXPLORER'] },
  { label: 'Tableau de bord', path: '/organizer/dashboard', experiences: ['ORGANIZER'], permission: 'event.create', requiresOrganization: true },
  { label: 'Nos événements', path: '/organizer/events', experiences: ['ORGANIZER'], permission: 'event.create', requiresOrganization: true },
  { label: 'Organisations', path: '/organizer/organizations', experiences: ['ORGANIZER'] },
  { label: 'Validation', path: '/validation', experiences: ['OPERATOR'], permission: 'validation.review' },
  { label: 'Dossiers', path: '/operator/cases', experiences: ['OPERATOR'], permission: 'case.manage' },
  { label: 'Termes de modération', path: '/operator/moderation-terms', experiences: ['OPERATOR'], permission: 'case.manage' },
  { label: 'Utilisateurs & organisations', path: '/operator/admin', experiences: ['OPERATOR'], permission: 'user.manage' },
  { label: 'Administration', path: '/admin', experiences: ['OPERATOR'], permission: 'reference.manage' },
  { label: 'Configuration', path: '/operator/config', experiences: ['OPERATOR'], permission: 'pipeline.manage' },
  { label: 'Notifications', path: '/notifications', experiences: ['EXPLORER', 'ORGANIZER', 'OPERATOR'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly account = inject(AccountApi);
  readonly experiences = EXPERIENCES;
  readonly me = this.identity.me;
  readonly unreadNotifications = this.notificationsApi.unread;
  readonly onboarding = signal<OnboardingState | null>(null);
  readonly termsDone = computed(() =>
    (this.onboarding()?.steps ?? []).some((s) => s.key === 'terms_accepted' && s.done),
  );

  readonly activeExperience = computed<Experience | null>(() => this.me()?.activeExperience ?? null);
  // Le switcher n'affiche que les expériences réellement débloquées : masqué pour un Explorer pur
  // (une seule expérience), Explorer/Organizer pour un organisateur, les trois pour un Operator.
  readonly visibleExperiences = computed(() =>
    EXPERIENCES.filter((exp) => this.isAvailable(exp.key)),
  );
  readonly organizations = computed(() => this.me()?.organizations ?? []);
  readonly initials = computed(() => toInitials(this.me()?.displayName || this.me()?.email || ''));

  readonly visibleNav = computed<NavItem[]>(() => {
    const me = this.me();
    const experience = me?.activeExperience;
    if (!me || !experience) {
      return [];
    }
    const hasOrganization = (me.organizations ?? []).length > 0;
    return NAV.filter(
      (item) =>
        item.experiences.includes(experience) &&
        (!item.permission || me.permissions.includes(item.permission)) &&
        // Entonnoir Organizer : les menus liés à une organisation restent masqués tant que
        // l'utilisateur n'est rattaché à aucune (seul « Organisations » demeure).
        (!item.requiresOrganization || hasOrganization),
    );
  });

  ngOnInit(): void {
    this.identity.loadMe().subscribe((me) => this.theme.syncFromPreferences(me.preferences));
    this.notificationsApi.refreshUnread();
    this.account.onboarding().subscribe((ob) => this.onboarding.set(ob));
  }

  acceptTerms(): void {
    this.account.acceptTerms().subscribe((ob) => this.onboarding.set(ob));
  }

  isAvailable(experience: Experience): boolean {
    return this.me()?.experiences.includes(experience) ?? false;
  }

  switchExperience(experience: Experience): void {
    if (experience === this.activeExperience() || !this.isAvailable(experience)) {
      return;
    }
    this.identity.changeExperience(experience).subscribe(() => {
      // Atterrissage sur l'accueil de l'expérience choisie (les autres restent sur place). Un
      // organisateur sans organisation est dirigé vers « Organisations » (entonnoir) plutôt que
      // vers un tableau de bord masqué.
      const hasOrganization = this.organizations().length > 0;
      const landing: Partial<Record<Experience, string>> = {
        EXPLORER: '/home',
        ORGANIZER: hasOrganization ? '/organizer/dashboard' : '/organizer/organizations',
      };
      const path = landing[experience];
      if (path) {
        void this.router.navigate([path]);
      }
    });
  }

  onOrgChange(event: Event): void {
    const organizationId = (event.target as HTMLSelectElement).value || null;
    this.identity.switchOrganization(organizationId).subscribe();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/welcome']);
  }
}
