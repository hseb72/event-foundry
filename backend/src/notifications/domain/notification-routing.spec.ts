import {
  DEFAULT_GLOBAL_SETTINGS,
  DEFAULT_USER_PREFERENCES,
  type NotificationGlobalSettings,
  type NotificationUserPreferences,
  resolveImmediateVector,
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

describe('resolveImmediateVector (priorité — RG-NOTIF-05)', () => {
  const settings = (over: Partial<NotificationGlobalSettings> = {}): NotificationGlobalSettings => ({
    vectors: { ...DEFAULT_GLOBAL_SETTINGS.vectors, ...over.vectors },
    frequencies: { ...DEFAULT_GLOBAL_SETTINGS.frequencies, ...over.frequencies },
  });
  const prefs = (over: Partial<NotificationUserPreferences> = {}): NotificationUserPreferences => ({
    ...DEFAULT_USER_PREFERENCES,
    ...over,
  });

  it('priorité normale : suit uniquement la piste immédiate', () => {
    expect(resolveImmediateVector('information', prefs({ immediate: 'email' }), settings())).toBe('email');
    // immédiat = aucun → rien maintenant (le récap s'en chargera), même si weekly est configuré.
    expect(resolveImmediateVector('information', prefs({ immediate: 'none', weekly: 'email' }), settings())).toBeNull();
    expect(resolveImmediateVector('important', prefs({ immediate: 'none', weekly: 'email' }), settings())).toBeNull();
  });

  it('critique : se rabat sur une piste de récap active pour diffuser immédiatement', () => {
    // immédiat = aucun, mais weekly = email → le critique part tout de suite en email.
    expect(resolveImmediateVector('critical', prefs({ immediate: 'none', weekly: 'email' }), settings())).toBe('email');
    // daily prioritaire sur weekly dans le repli.
    expect(
      resolveImmediateVector('critical', prefs({ immediate: 'none', daily: 'push', weekly: 'email' }), settings()),
    ).toBe('push');
  });

  it('critique : la piste immédiate reste prioritaire si elle est configurée', () => {
    expect(
      resolveImmediateVector('critical', prefs({ immediate: 'email', daily: 'push' }), settings()),
    ).toBe('email');
  });

  it('critique sans aucun vecteur configuré → null (in-app conserve la trace)', () => {
    expect(
      resolveImmediateVector('critical', prefs({ immediate: 'none', daily: 'none', weekly: 'none' }), settings()),
    ).toBeNull();
  });

  it('critique : le plus restrictif global s’applique toujours (vecteur désactivé globalement)', () => {
    const s = settings({ vectors: { email: false, push: true } });
    // weekly=email mais email désactivé globalement → repli échoue, null.
    expect(resolveImmediateVector('critical', prefs({ immediate: 'none', weekly: 'email' }), s)).toBeNull();
  });
});
