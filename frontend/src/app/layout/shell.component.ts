import { Component, computed, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IdentityService } from '../core/api/identity.service';
import { AuthService } from '../core/auth/auth.service';
import { Experience } from '../core/models';

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
  { key: 'EXPLORER', label: 'Explorer', color: 'var(--accent)' },
  { key: 'ORGANIZER', label: 'Organizer', color: 'var(--organizer)' },
  { key: 'OPERATOR', label: 'Operator', color: 'var(--admin)' },
];

// Navigation pilotée par l'EXPÉRIENCE active ET conditionnée par les PERMISSIONS (ADR.08/ADR.11) :
// changer d'expérience change les écrans proposés, sans jamais changer les droits.
const NAV: NavItem[] = [
  { label: 'Découvrir', path: '/discover', experiences: ['EXPLORER'], permission: 'catalog.read' },
  { label: 'Mon planning', path: '/calendar', experiences: ['EXPLORER'], permission: 'planning.manage' },
  { label: 'Créer un événement', path: '/create', experiences: ['ORGANIZER'], permission: 'event.create' },
  { label: 'Importer', path: '/import', experiences: ['ORGANIZER'], permission: 'import.create' },
  { label: 'Validation', path: '/validation', experiences: ['OPERATOR'], permission: 'validation.review' },
  { label: 'Administration', path: '/admin', experiences: ['OPERATOR'], permission: 'reference.manage' },
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
      .empty {
        font-size: 0.8rem;
        color: #9a94ad;
        padding: 0.4rem 0.2rem;
      }
      .user {
        margin-top: auto;
        display: grid;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #cfc9de;
      }
      .logout {
        background: transparent;
        color: #d9d5e6;
        border-color: rgba(255, 255, 255, 0.2);
      }
      .main {
        padding: 2rem;
        overflow-x: hidden;
      }
      @media (max-width: 720px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .main {
          padding: 1rem;
        }
      }
    `,
  ],
  template: `
    <div class="layout" [style.--exp]="accent()">
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
            <a [routerLink]="item.path" routerLinkActive="active">{{ item.label }}</a>
          }
          @if (!visibleNav().length) {
            <div class="empty">Aucun écran disponible dans ce contexte.</div>
          }
          <a routerLink="/me" routerLinkActive="active">Mon identité</a>
        </nav>

        <div class="user">
          <div>{{ me()?.email }}</div>
          @if (me()?.subscription; as sub) {
            <div><span class="sub">{{ sub }}</span></div>
          }
          <button class="btn logout" (click)="logout()">Se déconnecter</button>
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
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly experiences = EXPERIENCES;
  readonly me = this.identity.me;

  readonly activeExperience = computed<Experience | null>(() => this.me()?.activeExperience ?? null);
  readonly organizations = computed(() => this.me()?.organizations ?? []);
  readonly accent = computed(
    () => EXPERIENCES.find((e) => e.key === this.activeExperience())?.color ?? 'var(--accent)',
  );

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
    this.identity.loadMe().subscribe();
  }

  isAvailable(experience: Experience): boolean {
    return this.me()?.experiences.includes(experience) ?? false;
  }

  switchExperience(experience: Experience): void {
    if (experience === this.activeExperience() || !this.isAvailable(experience)) {
      return;
    }
    this.identity.changeExperience(experience).subscribe();
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
