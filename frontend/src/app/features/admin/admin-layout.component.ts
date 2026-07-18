import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Coquille de l'espace d'administration (EPIC 12) : sous-navigation + contenu. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [
    `
      .subnav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.75rem;
      }
      .subnav a {
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        color: var(--muted);
        font-weight: 600;
      }
      .subnav a:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .subnav a.active {
        background: var(--accent);
        color: #fff;
      }
    `,
  ],
  template: `
    <nav class="subnav">
      <a routerLink="dashboard" routerLinkActive="active">Tableau de bord</a>
      <a routerLink="reference" routerLinkActive="active">Référentiels</a>
      <a routerLink="users" routerLinkActive="active">Utilisateurs</a>
      <a routerLink="jobs" routerLinkActive="active">Imports</a>
    </nav>
    <router-outlet />
  `,
})
export class AdminLayoutComponent {}
