import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  type NotificationGlobalSettings,
  type NotificationUserPreferences,
  resolveOutboundVector,
} from './notification-routing';

describe('resolveOutboundVector (Channel Router — RG-NOTIF-03/04)', () => {
  const settings = (over: Partial<NotificationGlobalSettings> = {}): NotificationGlobalSettings => ({
    vectors: { ...DEFAULT_GLOBAL_SETTINGS.vectors, ...over.vectors },
    frequencies: { ...DEFAULT_GLOBAL_SETTINGS.frequencies, ...over.frequencies },
  });
  const prefs = (over: Partial<NotificationUserPreferences> = {}): NotificationUserPreferences => ({
    ...DEFAULT_USER_PREFERENCES,
    ...over,
  });

  it('renvoie le vecteur choisi quand piste et vecteur sont activés globalement', () => {
    expect(resolveOutboundVector('immediate', prefs({ immediate: 'email' }), settings())).toBe('email');
    expect(resolveOutboundVector('weekly', prefs({ weekly: 'push' }), settings())).toBe('push');
  });

  it('« aucun » individuel bloque tout envoi', () => {
    expect(resolveOutboundVector('immediate', prefs({ immediate: 'none' }), settings())).toBeNull();
  });

  it('le plus restrictif gagne : vecteur désactivé globalement → aucun envoi', () => {
    const s = settings({ vectors: { email: true, push: false } });
    expect(resolveOutboundVector('immediate', prefs({ immediate: 'push' }), s)).toBeNull();
  });

  it('le plus restrictif gagne : piste désactivée globalement → aucun envoi', () => {
    const s = settings({ frequencies: { immediate: false, daily: true, weekly: true } });
    expect(resolveOutboundVector('immediate', prefs({ immediate: 'email' }), s)).toBeNull();
  });

  it('pistes indépendantes : chaque piste résout son propre vecteur', () => {
    const p = prefs({ immediate: 'none', daily: 'push', weekly: 'email' });
    expect(resolveOutboundVector('immediate', p, settings())).toBeNull();
    expect(resolveOutboundVector('daily', p, settings())).toBe('push');
    expect(resolveOutboundVector('weekly', p, settings())).toBe('email');
  });
});
