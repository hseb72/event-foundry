import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: 240px 1fr;
        min-height: 100vh;
      }
      .sidebar {
        background: linear-gradient(180deg, #2a1b3d 0%, #1e1330 100%);
        color: #fff;
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .brand {
        font-weight: 800;
        font-size: 1.25rem;
        color: #fff;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      nav a {
        padding: 0.6rem 0.8rem;
        border-radius: 10px;
        color: #d9d5e6;
        font-weight: 500;
      }
      nav a:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      nav a.active {
        background: var(--accent);
        color: #fff;
      }
      .logout {
        margin-top: auto;
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
        .sidebar {
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
        }
        .logout {
          margin: 0;
        }
        .main {
          padding: 1rem;
        }
      }
    `,
  ],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">EventFoundry</div>
        <nav>
          <a routerLink="/discover" routerLinkActive="active">Découvrir</a>
          <a routerLink="/calendar" routerLinkActive="active">Mon planning</a>
          <a routerLink="/import" routerLinkActive="active">Importer</a>
          <a routerLink="/validation" routerLinkActive="active">Validation</a>
          <a routerLink="/create" routerLinkActive="active">Créer</a>
          @if (isAdmin) {
            <a routerLink="/dashboard" routerLinkActive="active">Tableau de bord</a>
            <a routerLink="/admin" routerLinkActive="active">Administration</a>
          }
        </nav>
        <button class="btn logout" (click)="logout()">Se déconnecter</button>
      </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  readonly isAdmin: boolean;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {
    this.isAdmin = this.auth.isAdmin();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
