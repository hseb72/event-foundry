import { Injectable, signal } from '@angular/core';
import { ThemePreference } from './models';

const STORAGE_KEY = 'ef.theme';

/**
 * Gère le thème d'interface (clair / sombre / système) — préférence utilisateur orthogonale à
 * l'identité d'univers (ADR.22 §Thèmes / FSPEC.05). Applique l'attribut `data-theme` sur <html>,
 * résout `system` via `prefers-color-scheme`, et conserve le choix localement pour un rendu
 * immédiat au démarrage (la persistance serveur passe par User Preferences).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Préférence choisie (light | dark | system). */
  readonly preference = signal<ThemePreference>(readStored());
  /** Thème effectivement appliqué (light | dark), après résolution de `system`. */
  readonly resolved = signal<'light' | 'dark'>('light');

  private readonly media =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;

  constructor() {
    this.media?.addEventListener('change', () => {
      if (this.preference() === 'system') {
        this.apply();
      }
    });
    this.apply();
  }

  /** Applique une préférence (et la mémorise localement). */
  set(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* stockage indisponible : rendu immédiat conservé, persistance serveur uniquement. */
    }
    this.apply();
  }

  /** Aligne le service sur la préférence renvoyée par le serveur (au chargement de `me`). */
  syncFromPreferences(preferences: Record<string, unknown> | null | undefined): void {
    const theme = (preferences?.['theme'] as ThemePreference | undefined) ?? null;
    if (theme && theme !== this.preference()) {
      this.preference.set(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* ignore */
      }
      this.apply();
    }
  }

  private apply(): void {
    const preference = this.preference();
    const effective: 'light' | 'dark' =
      preference === 'system' ? (this.media?.matches ? 'dark' : 'light') : preference;
    this.resolved.set(effective);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', effective);
    }
  }
}

function readStored(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
  } catch {
    /* ignore */
  }
  return 'system';
}
