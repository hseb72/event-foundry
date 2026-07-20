import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IdentityService } from '../../core/api/identity.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme.service';
import { Experience, ThemePreference } from '../../core/models';

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
  imports: [FormsModule],
  styles: [
    `
      .head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
      }
      .avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--exp);
        color: var(--exp-contrast);
        font-weight: 800;
        font-size: 1rem;
      }
      .theme-opts {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .theme-opt {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        border-radius: 10px;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .theme-opt.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
      .soon {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--exp-weak);
        color: var(--exp);
        margin-left: 0.4rem;
      }
      .vecteurs {
        display: grid;
        gap: 0.5rem;
      }
      .vec {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.5rem 0.65rem;
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .vec-name {
        font-weight: 600;
        font-size: 0.9rem;
      }
      .pill {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        border-radius: 999px;
        padding: 0.3rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .pill.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
      .pill.locked {
        cursor: default;
        opacity: 0.85;
      }
      .head h1 {
        margin: 0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
        align-items: start;
      }
      .card h2 {
        font-size: 0.95rem;
        margin: 0 0 0.75rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .chip {
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .chip.exp {
        color: #fff;
        border: 0;
      }
      .chip.exp.off {
        color: var(--muted);
        background: var(--bg);
        border: 1px dashed var(--border);
      }
      .perm-group {
        margin-bottom: 0.7rem;
      }
      .perm-group .g {
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin-bottom: 0.25rem;
      }
      .perm {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.78rem;
        padding: 0.1rem 0.5rem;
        border-radius: 6px;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .org {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.75rem;
        margin-bottom: 0.6rem;
      }
      .org.active {
        border-color: var(--organizer);
        box-shadow: 0 0 0 1px var(--organizer);
      }
      .org-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
      }
      .org-name {
        font-weight: 700;
      }
      .sub {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .badge {
        color: #fff;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      .active-tag {
        font-size: 0.72rem;
        color: var(--organizer);
        font-weight: 700;
      }
    `,
  ],
  template: `
    @if (me(); as m) {
      <div class="head">
        <span class="avatar" aria-hidden="true">{{ initials() }}</span>
        <h1>{{ m.displayName }}</h1>
        <span class="muted">{{ m.email }}</span>
        @if (m.activeExperience) {
          <span class="badge" [style.background]="color(m.activeExperience)">
            {{ label(m.activeExperience) }}
          </span>
        }
      </div>

      <div class="grid">
        <section class="card">
          <h2>Données personnelles</h2>
          @if (editing()) {
            <div style="display:grid;gap:0.5rem;max-width:280px">
              <label class="muted" style="font-size:0.78rem">Nom affiché (nickname)</label>
              <input class="input" [(ngModel)]="draftName" placeholder="Nom affiché" />
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary" (click)="saveProfile()">Enregistrer</button>
                <button class="btn" (click)="editing.set(false)">Annuler</button>
              </div>
            </div>
          } @else {
            <p style="margin:0 0 0.3rem"><strong>{{ m.displayName }}</strong></p>
            <p class="muted" style="margin:0 0 0.6rem;font-size:0.85rem">
              {{ m.email }} <span class="muted">· e-mail de connexion (non modifiable)</span>
            </p>
            <button class="btn" (click)="startEdit(m.displayName)">Modifier le nom affiché</button>
          }
        </section>

        <section class="card">
          <h2>Expériences disponibles</h2>
          <div class="chips">
            @for (exp of allExperiences; track exp) {
              @if (m.experiences.includes(exp)) {
                <span
                  class="chip exp"
                  [class.off]="m.activeExperience !== exp"
                  [style.background]="m.activeExperience === exp ? color(exp) : ''"
                >
                  {{ label(exp) }}
                </span>
              }
            }
          </div>
          <p class="muted" style="margin:0.75rem 0 0;font-size:0.8rem">
            Le changement d'expérience se fait dans la barre latérale. Il ne modifie jamais les
            permissions.
          </p>
        </section>

        <section class="card">
          <h2>Rôles</h2>
          <div class="chips">
            @for (role of m.roles; track role) {
              <span class="chip">{{ role }}</span>
            }
          </div>
        </section>

        <section class="card">
          <h2>Permissions effectives ({{ m.permissions.length }})</h2>
          @for (grp of permissionGroups(); track grp.group) {
            <div class="perm-group">
              <div class="g">{{ grp.group }}</div>
              <div class="chips">
                @for (key of grp.keys; track key) {
                  <span class="perm">{{ key }}</span>
                }
              </div>
            </div>
          }
        </section>

        <section class="card">
          <h2>Organisations</h2>
          @if (!m.organizations.length) {
            <p class="muted" style="font-size:0.85rem">Aucune organisation.</p>
          }
          @for (org of m.organizations; track org.id) {
            <div class="org" [class.active]="org.id === m.activeOrganizationId">
              <div class="org-head">
                <span class="org-name">{{ org.name }}</span>
                @if (org.subscription) {
                  <span class="sub">{{ org.subscription }}</span>
                }
              </div>
              <div class="chips">
                @for (role of org.roles; track role) {
                  <span class="chip">{{ role }}</span>
                }
              </div>
              <div style="margin-top:0.5rem">
                @if (org.id === m.activeOrganizationId) {
                  <span class="active-tag">● Organisation active</span>
                } @else {
                  <button class="btn" (click)="activate(org.id)">Activer ce contexte</button>
                }
              </div>
            </div>
          }
        </section>

        <section class="card">
          <h2>Configurations personnelles <span class="soon">Bientôt</span></h2>
          <p class="muted" style="font-size:0.85rem;margin:0">
            Branchez votre propre IA (fournisseur, clé API, cas d'usage) pour assister vos imports.
            La clé sera stockée comme un secret (jamais affichée en clair). Disponible avec le
            domaine IA de la V3.
          </p>
        </section>

        <section class="card">
          <h2>Autres préférences</h2>
          <label class="muted" style="font-size:0.78rem;display:block;margin-bottom:0.4rem">Thème</label>
          <div class="theme-opts">
            @for (opt of themeOptions; track opt.value) {
              <button
                type="button"
                class="theme-opt"
                [class.on]="themePreference() === opt.value"
                (click)="setTheme(opt.value)"
              >
                {{ opt.label }}
              </button>
            }
          </div>
          <p class="muted" style="font-size:0.78rem;margin:0.6rem 0 0">
            « Système » suit le réglage clair/sombre de votre appareil.
          </p>
        </section>

        <section class="card">
          <h2>Préférences de notification</h2>
          <p class="muted" style="font-size:0.78rem;margin:0 0 0.7rem">
            Choisissez les vecteurs de diffusion. L'application (in-app) reste toujours active :
            elle conserve l'historique consultable.
          </p>
          <div class="vecteurs">
            <div class="vec">
              <div>
                <div class="vec-name">In-app</div>
                <div class="muted" style="font-size:0.76rem">Historique — toujours actif</div>
              </div>
              <span class="pill on locked">Actif</span>
            </div>
            <div class="vec">
              <div>
                <div class="vec-name">E-mail</div>
                <div class="muted" style="font-size:0.76rem">Recevoir un e-mail</div>
              </div>
              <button
                type="button"
                class="pill"
                [class.on]="notifPref('email')"
                (click)="toggleNotif('email')"
              >
                {{ notifPref('email') ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
            <div class="vec">
              <div>
                <div class="vec-name">Push</div>
                <div class="muted" style="font-size:0.76rem">Notification poussée</div>
              </div>
              <button
                type="button"
                class="pill"
                [class.on]="notifPref('push')"
                (click)="toggleNotif('push')"
              >
                {{ notifPref('push') ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
          </div>
          <p class="muted" style="font-size:0.76rem;margin:0.7rem 0 0">
            Les fréquences (immédiat / récap quotidien / hebdomadaire) arriveront avec le moteur de
            notifications de la V3.
          </p>
        </section>

        <section class="card">
          <h2>Session</h2>
          @if (m.subscription) {
            <p style="margin:0 0 0.6rem">
              Souscription : <span class="sub">{{ m.subscription }}</span>
            </p>
          }
          <button class="btn" (click)="logout()">Se déconnecter</button>
        </section>
      </div>
    } @else {
      <p class="muted">Chargement de l'identité…</p>
    }
  `,
})
export class IdentityComponent implements OnInit {
  private readonly identity = inject(IdentityService);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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

  /** État courant d'un vecteur de notification (lu depuis les préférences renvoyées par /me). */
  notifPref(channel: 'email' | 'push'): boolean {
    const notifications = (this.me()?.preferences?.['notifications'] ?? {}) as Record<string, unknown>;
    return notifications[channel] === true;
  }

  /** Active/désactive un vecteur ; honoré directement par le dispatcher de notifications. */
  toggleNotif(channel: 'email' | 'push'): void {
    const current = (this.me()?.preferences?.['notifications'] ?? {}) as Record<string, unknown>;
    const notifications = { ...current, [channel]: !this.notifPref(channel) };
    const preferences = { ...(this.me()?.preferences ?? {}), notifications };
    this.identity.updateProfile({ preferences }).subscribe();
  }

  setTheme(preference: ThemePreference): void {
    // Application immédiate (rendu) + persistance dans les préférences (User Preferences, ADR.20).
    this.theme.set(preference);
    const preferences = { ...(this.me()?.preferences ?? {}), theme: preference };
    this.identity.updateProfile({ preferences }).subscribe();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

/** Initiales d'affichage (1 à 2 lettres) à partir du nom ou de l'e-mail. */
function toInitials(source: string): string {
  const name = source.split('@')[0].trim();
  if (!name) {
    return '?';
  }
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
