import { Component, computed, inject, OnInit } from '@angular/core';
import { IdentityService } from '../../core/api/identity.service';
import { Experience } from '../../core/models';

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
  EXPLORER: 'var(--accent)',
  ORGANIZER: 'var(--organizer)',
  OPERATOR: 'var(--admin)',
};

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [],
  styles: [
    `
      .head {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
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
      </div>
    } @else {
      <p class="muted">Chargement de l'identité…</p>
    }
  `,
})
export class IdentityComponent implements OnInit {
  private readonly identity = inject(IdentityService);

  readonly allExperiences: Experience[] = ['EXPLORER', 'ORGANIZER', 'OPERATOR'];
  readonly me = this.identity.me;

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
}
