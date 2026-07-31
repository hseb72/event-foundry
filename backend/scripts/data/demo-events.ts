/**
 * Jeu d'événements **fictifs** pour la phase de test (données de démonstration, jamais de production).
 *
 * Le vocabulaire employé (activité / type / sujets / modalités / tags) est aligné sur la taxonomie
 * DATA.01 v2.0 semée par `prisma/seed.ts` + `prisma/seed-taxonomy-v2.ts`. Toute valeur introuvable en
 * base est **ignorée sans bloquer** (le script de seed le signale), afin de rester exécutable même sur
 * une base partiellement peuplée.
 *
 * `dayOffset` est relatif au jour d'exécution : des valeurs négatives produisent des événements passés
 * (utiles pour éprouver le planning et les archives), positives des événements à venir (Découverte,
 * page de garde). L'ensemble couvre volontairement plusieurs univers, statuts et visibilités.
 */

/** Statut de publication d'un événement de démonstration. */
export type DemoStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface DemoEvent {
  /** Suffixe d'identifiant stable (2 chiffres) — garantit l'idempotence du seed. */
  key: string;
  title: string;
  description: string;
  /** Activité (obligatoire, DATA.01 axe A) — doit exister en base. */
  activity: string;
  /** Type transverse (axe B). */
  eventType: string;
  /** Sujets (axe A, 0..N). */
  subjects: string[];
  /** Modalités (axe C, 0..N). */
  modalities: string[];
  /** Tags libres (axe D, 0..N). */
  tags?: string[];
  /** Nom de l'organisateur de démonstration (cf. DEMO_ORGANIZERS). */
  organizer?: string;
  /** Nom du lieu de démonstration (cf. DEMO_VENUES). */
  venue?: string;
  /** Décalage en jours par rapport à aujourd'hui (négatif = passé). */
  dayOffset: number;
  /** Heure de début (0-23), fuseau UTC — la conversion d'affichage est faite par l'API/le front. */
  hour: number;
  /** Durée en heures (détermine `endsAt`). */
  durationH: number;
  price?: number;
  status?: DemoStatus;
  /** `true` pour un événement **privé** rattaché à l'utilisateur de démonstration (FSPEC.22). */
  private?: boolean;
}

/** Organisateurs fictifs (référentiel Organizer). */
export const DEMO_ORGANIZERS = [
  { key: '01', name: 'Foundry Events (démo)', website: 'https://example.org/foundry-events' },
  { key: '02', name: 'Collectif Lumière (démo)', website: 'https://example.org/collectif-lumiere' },
  { key: '03', name: 'Ludo Club Montpellier (démo)', website: null },
  { key: '04', name: 'Association Grand Air (démo)', website: null },
];

/** Lieux fictifs (référentiel Venue). Les coordonnées permettent d'éprouver le tri par proximité. */
export const DEMO_VENUES = [
  { key: '01', name: 'Halle des Fêtes (démo)', city: 'Montpellier', address: '3 rue des Festivals', postalCode: '34000', latitude: 43.6108, longitude: 3.8767 },
  { key: '02', name: 'Le Comptoir des Jeux (démo)', city: 'Montpellier', address: '18 avenue du Jeu', postalCode: '34000', latitude: 43.6047, longitude: 3.8801 },
  { key: '03', name: 'Théâtre du Levant (démo)', city: 'Lyon', address: '5 place du Levant', postalCode: '69002', latitude: 45.7578, longitude: 4.832 },
  { key: '04', name: 'Parc des Cèdres (démo)', city: 'Lyon', address: 'Chemin des Cèdres', postalCode: '69003', latitude: 45.7485, longitude: 4.8467 },
  { key: '05', name: 'Studio Nord (démo)', city: 'Paris', address: '42 rue du Studio', postalCode: '75011', latitude: 48.8566, longitude: 2.3701 },
];

/**
 * Vingt-deux événements couvrant : plusieurs univers (jeux, musique, sport, gastronomie, cinéma,
 * technologie, nature, patrimoine…), tous les statuts (publié / brouillon / archivé), des événements
 * **publics** et **privés**, gratuits et payants, passés et à venir.
 */
export const DEMO_EVENTS: DemoEvent[] = [
  {
    key: '01',
    title: 'Tournoi Magic — Modern',
    description:
      'Tournoi Modern en ronde suisse (5 rondes), top 8 à suivre. Inscription sur place dès 13h30, lots pour les finalistes.',
    activity: 'Jeux',
    eventType: 'Tournoi',
    subjects: ['Magic'],
    modalities: ['Présentiel', 'Payant', 'Compétitif', 'Constructed'],
    tags: ['Bring your own deck', 'Prize support'],
    organizer: 'Ludo Club Montpellier (démo)',
    venue: 'Le Comptoir des Jeux (démo)',
    dayOffset: 6,
    hour: 12,
    durationH: 7,
    price: 15,
  },
  {
    key: '02',
    title: 'Draft Pokémon — soirée découverte',
    description: "Soirée d'initiation au format Draft, matériel fourni. Idéal pour débuter dans le jeu de cartes.",
    activity: 'Jeux',
    eventType: 'TCG',
    subjects: ['Pokémon'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Draft', 'Débutant'],
    tags: ['Nocturne'],
    organizer: 'Ludo Club Montpellier (démo)',
    venue: 'Le Comptoir des Jeux (démo)',
    dayOffset: 13,
    hour: 17,
    durationH: 4,
    price: 12,
  },
  {
    key: '03',
    title: 'Soirée jeux de plateau',
    description: 'Ludothèque ouverte : Catane, Wingspan, Terraforming Mars et une centaine de titres. Entrée libre.',
    activity: 'Jeux',
    eventType: 'Jeux de société',
    subjects: ['Catane', 'Wingspan', 'Terraforming Mars'],
    modalities: ['Présentiel', 'Libre', 'Gratuit', 'Convivial', 'Famille'],
    organizer: 'Ludo Club Montpellier (démo)',
    venue: 'Le Comptoir des Jeux (démo)',
    dayOffset: 3,
    hour: 18,
    durationH: 4,
  },
  {
    key: '04',
    title: 'Festival Lumière — soirée d’ouverture',
    description:
      'Trois scènes en plein air, une programmation éclectique de rock et de pop, food-trucks et animations jusqu’à minuit.',
    activity: 'Musique',
    eventType: 'Festival',
    subjects: ['Rock', 'Pop'],
    modalities: ['Présentiel', 'Payant', 'Extérieur', 'Festif', 'Tout public'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Parc des Cèdres (démo)',
    dayOffset: 21,
    hour: 18,
    durationH: 6,
    price: 29,
  },
  {
    key: '05',
    title: 'Jam session jazz & blues',
    description: 'Scène ouverte aux musiciens, backline sur place. Le public est le bienvenu, entrée à prix libre.',
    activity: 'Musique',
    eventType: 'Jam session',
    subjects: ['Jazz', 'Blues'],
    modalities: ['Présentiel', 'Libre', 'Gratuit', 'Convivial'],
    tags: ['Afterwork'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Studio Nord (démo)',
    dayOffset: 9,
    hour: 19,
    durationH: 3,
  },
  {
    key: '06',
    title: 'Concert de musique classique — quatuor à cordes',
    description: 'Programme Schubert et Ravel par un quatuor en résidence. Placement libre.',
    activity: 'Musique',
    eventType: 'Récital',
    subjects: ['Musique classique', 'Musique de chambre'],
    modalities: ['Présentiel', 'Payant', 'Culturel', 'Intérieur'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Théâtre du Levant (démo)',
    dayOffset: 34,
    hour: 19,
    durationH: 2,
    price: 22,
  },
  {
    key: '07',
    title: 'Cyrano de Bergerac',
    description: 'La pièce de Rostand dans une mise en scène contemporaine. Durée 2h30 avec entracte.',
    activity: 'Spectacle vivant',
    eventType: 'Théâtre',
    subjects: ['Comédie', 'Tragédie'],
    modalities: ['Présentiel', 'Payant', 'Culturel', 'Sous-titré'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Théâtre du Levant (démo)',
    dayOffset: 27,
    hour: 19,
    durationH: 3,
    price: 26,
  },
  {
    key: '08',
    title: 'Scène ouverte stand-up',
    description: 'Une dizaine d’humoristes, 7 minutes chacun. Nouveaux talents et têtes d’affiche mêlés.',
    activity: 'Spectacle vivant',
    eventType: 'One-man-show',
    subjects: ['Stand-up'],
    modalities: ['Présentiel', 'Payant', 'Festif', 'Adolescent'],
    tags: ['Nocturne'],
    organizer: 'Foundry Events (démo)',
    venue: 'Studio Nord (démo)',
    dayOffset: 16,
    hour: 19,
    durationH: 2,
    price: 10,
  },
  {
    key: '09',
    title: 'Marathon de la Métropole',
    description: 'Parcours homologué de 42,195 km, ravitaillements tous les 5 km. Retrait des dossards la veille.',
    activity: 'Sport',
    eventType: 'Marathon',
    subjects: ['Athlétisme'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Extérieur', 'Compétitif', 'Régional'],
    organizer: 'Association Grand Air (démo)',
    venue: 'Parc des Cèdres (démo)',
    dayOffset: 45,
    hour: 7,
    durationH: 6,
    price: 45,
  },
  {
    key: '10',
    title: 'Tournoi de padel amateur',
    description: 'Tournoi en double, format poules puis élimination directe. Ouvert aux licenciés et non-licenciés.',
    activity: 'Sport',
    eventType: 'Tournoi',
    subjects: ['Padel'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Compétitif', 'Équipe'],
    organizer: 'Association Grand Air (démo)',
    venue: 'Parc des Cèdres (démo)',
    dayOffset: 11,
    hour: 8,
    durationH: 8,
    price: 18,
  },
  {
    key: '11',
    title: 'Randonnée découverte — sentier des crêtes',
    description: 'Boucle de 12 km, dénivelé 350 m, accompagnée par un guide naturaliste. Prévoir de l’eau.',
    activity: 'Nature',
    eventType: 'Randonnée',
    subjects: ['Randonnée', 'Botanique'],
    modalities: ['Présentiel', 'Sur inscription', 'Gratuit', 'Extérieur', 'Famille'],
    organizer: 'Association Grand Air (démo)',
    dayOffset: 18,
    hour: 8,
    durationH: 5,
  },
  {
    key: '12',
    title: 'Atelier cuisine italienne',
    description: 'Pâtes fraîches et sauces de saison, en petit groupe (12 places). Dégustation en fin d’atelier.',
    activity: 'Gastronomie',
    eventType: 'Cours de cuisine',
    subjects: ['Cuisine italienne'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Convivial', 'Débutant'],
    organizer: 'Foundry Events (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 8,
    hour: 16,
    durationH: 3,
    price: 55,
  },
  {
    key: '13',
    title: 'Dégustation de vins du terroir',
    description: 'Cinq domaines de la région présentent leurs cuvées, commentées par un œnologue.',
    activity: 'Gastronomie',
    eventType: 'Dégustation',
    subjects: ['Vin'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Local'],
    tags: ['Édition limitée'],
    organizer: 'Foundry Events (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 30,
    hour: 17,
    durationH: 3,
    price: 24,
  },
  {
    key: '14',
    title: 'Ciné-débat : documentaire climat',
    description: 'Projection suivie d’un échange avec la réalisatrice et un chercheur en climatologie.',
    activity: 'Cinéma',
    eventType: 'Ciné-débat',
    subjects: ['Documentaire'],
    modalities: ['Présentiel', 'Gratuit', 'Éducatif', 'Tout public'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Studio Nord (démo)',
    dayOffset: 5,
    hour: 18,
    durationH: 3,
  },
  {
    key: '15',
    title: 'Avant-première science-fiction',
    description: 'Projection en avant-première, séance unique. Places limitées.',
    activity: 'Cinéma',
    eventType: 'Avant-première',
    subjects: ['Science-fiction'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant'],
    tags: ['Collector', 'Nocturne'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Studio Nord (démo)',
    dayOffset: 24,
    hour: 20,
    durationH: 3,
    price: 12,
  },
  {
    key: '16',
    title: 'Meetup développement & IA',
    description: 'Deux retours d’expérience courts puis échanges libres autour d’un buffet. Niveau intermédiaire.',
    activity: 'Technologie',
    eventType: 'Meetup',
    subjects: ['Développement', 'Intelligence artificielle'],
    modalities: ['Hybride', 'Sur inscription', 'Gratuit', 'Professionnel'],
    tags: ['Afterwork'],
    organizer: 'Foundry Events (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 14,
    hour: 17,
    durationH: 3,
  },
  {
    key: '17',
    title: 'Hackathon week-end — mobilité douce',
    description: '48 heures pour prototyper une solution de mobilité. Équipes de 3 à 5, mentors présents.',
    activity: 'Technologie',
    eventType: 'Hackathon',
    subjects: ['Développement'],
    modalities: ['Présentiel', 'Sur inscription', 'Gratuit', 'Équipe', 'Étudiant'],
    organizer: 'Foundry Events (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 52,
    hour: 8,
    durationH: 10,
  },
  {
    key: '18',
    title: 'Tournoi Esport — Rocket League',
    description: 'Tournoi 3v3 en LAN, diffusion sur grand écran. Inscription par équipe constituée.',
    activity: 'Esport',
    eventType: 'LAN',
    subjects: ['Rocket League'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Compétitif', 'Équipe'],
    tags: ['Speedrun'],
    organizer: 'Ludo Club Montpellier (démo)',
    venue: 'Le Comptoir des Jeux (démo)',
    dayOffset: 38,
    hour: 10,
    durationH: 9,
    price: 20,
  },
  {
    key: '19',
    title: 'Visite guidée du centre historique',
    description: 'Deux heures de visite commentée, du parvis médiéval aux hôtels particuliers du XVIIᵉ.',
    activity: 'Patrimoine',
    eventType: 'Monument',
    subjects: ['Monument', 'Site historique'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Culturel', 'Senior'],
    organizer: 'Foundry Events (démo)',
    dayOffset: 12,
    hour: 9,
    durationH: 2,
    price: 8,
  },
  {
    key: '20',
    title: 'Exposition photographique — regards urbains',
    description: 'Une trentaine de tirages grand format, vernissage le premier soir en présence des artistes.',
    activity: 'Arts',
    eventType: 'Exposition',
    subjects: ['Photographie', 'Street art'],
    modalities: ['Présentiel', 'Libre', 'Gratuit', 'Culturel', 'Temporaire'],
    organizer: 'Collectif Lumière (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 2,
    hour: 10,
    durationH: 8,
  },
  // --- Événements passés (planning, archives) ---
  {
    key: '21',
    title: 'Vide-grenier de quartier',
    description: 'Une centaine d’exposants, buvette associative. Édition passée conservée pour l’historique.',
    activity: 'Communauté',
    eventType: 'Vide-grenier',
    // « Communauté » ne porte pas de famille/sujet dans la taxonomie généraliste : 0 sujet (autorisé).
    subjects: [],
    modalities: ['Présentiel', 'Libre', 'Gratuit', 'Local', 'Famille'],
    tags: ['Vintage'],
    organizer: 'Association Grand Air (démo)',
    venue: 'Parc des Cèdres (démo)',
    dayOffset: -12,
    hour: 7,
    durationH: 8,
    status: 'ARCHIVED',
  },
  {
    key: '22',
    title: 'Collecte solidaire de printemps',
    description: 'Collecte de denrées non périssables au profit de l’épicerie sociale.',
    activity: 'Solidarité',
    eventType: 'Collecte',
    subjects: ['Collecte alimentaire'],
    modalities: ['Présentiel', 'Gratuit', 'Caritatif', 'Local'],
    organizer: 'Association Grand Air (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: -30,
    hour: 9,
    durationH: 6,
  },
  // --- Brouillons (vue Organizer : bascule de publication) ---
  {
    key: '23',
    title: 'Atelier céramique — brouillon',
    description: 'Programmation en cours de calage : tarifs et horaires à confirmer avant publication.',
    activity: 'Arts',
    eventType: 'Atelier',
    subjects: ['Céramique'],
    modalities: ['Présentiel', 'Sur inscription', 'Payant', 'Débutant'],
    organizer: 'Foundry Events (démo)',
    venue: 'Halle des Fêtes (démo)',
    dayOffset: 60,
    hour: 14,
    durationH: 3,
    price: 35,
    status: 'DRAFT',
  },
  {
    key: '24',
    title: 'Conférence astronomie — brouillon',
    description: 'Intervenant pressenti, salle à réserver. Ne pas publier en l’état.',
    activity: 'Sciences',
    eventType: 'Conférence',
    subjects: ['Astronomie'],
    modalities: ['Présentiel', 'Gratuit', 'Éducatif', 'Tout public'],
    organizer: 'Foundry Events (démo)',
    dayOffset: 70,
    hour: 18,
    durationH: 2,
    status: 'DRAFT',
  },
  // --- Événements privés (expérience Explorer : « Mes événements privés ») ---
  {
    key: '25',
    title: 'Anniversaire de Camille',
    description: 'Repas entre amis, apporter un dessert. Événement personnel, jamais publié au catalogue.',
    activity: 'Communauté',
    eventType: 'Rencontre',
    subjects: [],
    modalities: ['Présentiel', 'Sur invitation', 'Gratuit', 'Convivial'],
    dayOffset: 19,
    hour: 18,
    durationH: 5,
    private: true,
  },
  {
    key: '26',
    title: 'Séance ciné entre amis',
    description: 'Séance repérée à titre personnel, à confirmer selon les disponibilités de chacun.',
    activity: 'Cinéma',
    eventType: 'Projection',
    subjects: ['Comédie dramatique'],
    modalities: ['Présentiel', 'Payant'],
    dayOffset: 4,
    hour: 19,
    durationH: 2,
    price: 11,
    private: true,
  },
];
