import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IdentityService } from '../core/api/identity.service';
import { NotificationsApi } from '../core/api/notifications.service';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme.service';
import { Experience } from '../core/models';
import { toInitials } from '../shared/initials';

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
  { label: 'Mes suivis', path: '/follows', experiences: ['EXPLORER'] },
  { label: 'Tableau de bord', path: '/organizer/dashboard', experiences: ['ORGANIZER'], permission: 'event.create' },
  { label: 'Mes événements', path: '/organizer/events', experiences: ['ORGANIZER'], permission: 'event.create' },
  { label: 'Créer un événement', path: '/create', experiences: ['ORGANIZER'], permission: 'event.create' },
  { label: 'Importer', path: '/import', experiences: ['ORGANIZER'], permission: 'import.create' },
  { label: 'Validation', path: '/validation', experiences: ['OPERATOR'], permission: 'validation.review' },
  { label: 'Utilisateurs & organisations', path: '/operator/admin', experiences: ['OPERATOR'], permission: 'user.manage' },
  { label: 'Administration', path: '/admin', experiences: ['OPERATOR'], permission: 'reference.manage' },
  { label: 'Notifications', path: '/notifications', experiences: ['EXPLORER', 'ORGANIZER', 'OPERATOR'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: 250px 1fr;
        min-height: 100vh;
      }
      .sidebar {
        background: linear-gradient(180deg, #2a1b3d 0%, #1e1330 100%);
        color: #fff;
        padding: 1.25rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
        /* Barre latérale épinglée : le bloc profil reste visible même si le contenu défile. */
        position: sticky;
        top: 0;
        align-self: start;
        height: 100vh;
        overflow-y: auto;
      }
      .brand {
        font-weight: 800;
        font-size: 1.25rem;
        color: #fff;
      }
      .switcher {
        display: flex;
        gap: 0.3rem;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 0.25rem;
      }
      .switcher button {
        flex: 1;
        border: 0;
        background: transparent;
        color: #cfc9de;
        border-radius: 9px;
        padding: 0.4rem 0.3rem;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .switcher button:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .switcher button.on {
        background: var(--exp);
        color: #fff;
      }
      .ctx {
        font-size: 0.75rem;
        color: #b7b1c8;
        display: grid;
        gap: 0.35rem;
      }
      .ctx select {
        width: 100%;
        padding: 0.4rem 0.5rem;
        border-radius: 9px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        font: inherit;
        font-size: 0.8rem;
      }
      .sub {
        display: inline-block;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        font-weight: 700;
        font-size: 0.7rem;
        letter-spacing: 0.03em;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      nav a {
        padding: 0.55rem 0.8rem;
        border-radius: 10px;
        color: #d9d5e6;
        font-weight: 500;
        font-size: 0.92rem;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      nav a.active {
        background: var(--exp);
        color: #fff;
      }
      nav a {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .badge {
        background: var(--exp);
        color: var(--exp-contrast);
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        min-width: 1.2rem;
        text-align: center;
        padding: 0.05rem 0.35rem;
      }
      .empty {
        font-size: 0.8rem;
        color: #9a94ad;
        padding: 0.4rem 0.2rem;
      }
      .profile {
        margin-top: auto;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }
      .profile-link {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0.45rem;
        border-radius: 12px;
        min-width: 0;
      }
      .profile-link:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      .profile-link.on {
        background: var(--exp);
      }
      .avatar {
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--exp);
        color: var(--exp-contrast);
        font-weight: 800;
        font-size: 0.82rem;
        letter-spacing: 0.02em;
      }
      .profile-link.on .avatar {
        background: rgba(255, 255, 255, 0.25);
      }
      .profile-info {
        display: grid;
        gap: 0.1rem;
        min-width: 0;
      }
      .profile-name {
        font-weight: 700;
        font-size: 0.88rem;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .profile-sub {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #b7b1c8;
        text-transform: uppercase;
      }
      .logout-icon {
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        border-radius: 9px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: transparent;
        color: #d9d5e6;
        font-size: 1rem;
        line-height: 1;
      }
      .logout-icon:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .main {
        padding: 2rem;
        overflow-x: hidden;
      }
      @media (max-width: 720px) {
        .layout {
          grid-template-columns: 1fr;
        }
        /* Empilée en mobile : on rétablit un flux normal (pas d'épinglage plein écran). */
        .sidebar {
          position: static;
          height: auto;
          overflow-y: visible;
        }
        .main {
          padding: 1rem;
        }
      }
    `,
  ],
  template: `
    <div class="layout" [attr.data-exp]="activeExperience()">
      <aside class="sidebar">
        <div class="brand">EventFoundry</div>

        <div class="switcher" role="tablist" aria-label="Expérience active">
          @for (exp of experiences; track exp.key) {
            <button
              type="button"
              [class.on]="activeExperience() === exp.key"
              [disabled]="!isAvailable(exp.key)"
              [style.--exp]="exp.color"
              (click)="switchExperience(exp.key)"
            >
              {{ exp.label }}
            </button>
          }
        </div>

        @if (activeExperience() === 'ORGANIZER' && organizations().length) {
          <div class="ctx">
            <label for="org">Organisation active</label>
            <select id="org" [value]="me()?.activeOrganizationId ?? ''" (change)="onOrgChange($event)">
              @for (org of organizations(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            </select>
          </div>
        }

        <nav>
          @for (item of visibleNav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active">
              <span>{{ item.label }}</span>
              @if (item.path === '/notifications' && unreadNotifications() > 0) {
                <span class="badge">{{ unreadNotifications() }}</span>
              }
            </a>
          }
          @if (!visibleNav().length) {
            <div class="empty">Aucun écran disponible dans ce contexte.</div>
          }
        </nav>

        <!-- Menu profil unifié (FSPEC.11) : pastille avatar + nickname, toujours visible
             (sidebar sticky), point d'entrée unique vers la gestion du profil. -->
        <div class="profile">
          <a class="profile-link" routerLink="/me" routerLinkActive="on" aria-label="Mon profil">
            <span class="avatar" aria-hidden="true">{{ initials() }}</span>
            <span class="profile-info">
              <span class="profile-name">{{ me()?.displayName || me()?.email }}</span>
              @if (me()?.subscription; as sub) {
                <span class="profile-sub">{{ sub }}</span>
              }
            </span>
          </a>
          <button class="logout-icon" (click)="logout()" title="Se déconnecter" aria-label="Se déconnecter">⎋</button>
        </div>
      </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly notificationsApi = inject(NotificationsApi);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly experiences = EXPERIENCES;
  readonly me = this.identity.me;
  readonly unreadNotifications = this.notificationsApi.unread;

  readonly activeExperience = computed<Experience | null>(() => this.me()?.activeExperience ?? null);
  readonly organizations = computed(() => this.me()?.organizations ?? []);
  readonly initials = computed(() => toInitials(this.me()?.displayName || this.me()?.email || ''));

  readonly visibleNav = computed<NavItem[]>(() => {
    const me = this.me();
    const experience = me?.activeExperience;
    if (!me || !experience) {
      return [];
    }
    return NAV.filter(
      (item) =>
        item.experiences.includes(experience) &&
        (!item.permission || me.permissions.includes(item.permission)),
    );
  });

  ngOnInit(): void {
    this.identity.loadMe().subscribe((me) => this.theme.syncFromPreferences(me.preferences));
    this.notificationsApi.refreshUnread();
  }

  isAvailable(experience: Experience): boolean {
    return this.me()?.experiences.includes(experience) ?? false;
  }

  switchExperience(experience: Experience): void {
    if (experience === this.activeExperience() || !this.isAvailable(experience)) {
      return;
    }
    this.identity.changeExperience(experience).subscribe(() => {
      // Atterrissage sur l'accueil de l'expérience choisie (les autres restent sur place).
      const landing: Partial<Record<Experience, string>> = {
        EXPLORER: '/home',
        ORGANIZER: '/organizer/dashboard',
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
    void this.router.navigate(['/login']);
  }
}
