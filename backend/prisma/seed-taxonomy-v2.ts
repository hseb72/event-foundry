import { PrismaClient } from '@prisma/client';

/**
 * Seed de la taxonomie DATA.01 **v2.0** (phase additive — cf. DATA.01 §9).
 *
 * Encode le vocabulaire des axes A (Family → Subject) et C (ModalityDimension → Modality). Les
 * familles/sujets sont rattachés aux **Activités généralistes existantes** (Domain « Général »).
 * Les univers (Domains) et le déplacement des ex-Activités TCG (Magic, Pokémon…) vers des Subjects,
 * ainsi que la mise hors service des anciens Format/Catégorie, relèvent de la migration des données
 * (rewire Event). Ici : purement additif, idempotent (upserts). Le doc DATA.01 fait foi.
 */

// Axe A — Family → Subjects, par Activité (noms alignés sur les activités généralistes existantes).
const FAMILIES_SUBJECTS: Record<string, Record<string, string[]>> = {
  Jeux: {
    TCG: [
      'Magic', 'Pokémon', 'Lorcana', 'One Piece', 'Star Wars Unlimited', 'Flesh and Blood',
      'Riftbound', 'Yu-Gi-Oh!', 'Altered', 'Dragon Ball Super', 'Union Arena', 'KeyForge',
    ],
    'Jeu de plateau': [
      'Catane', 'Carcassonne', '7 Wonders', 'Terraforming Mars', 'Wingspan',
      'Les Aventuriers du Rail', 'Azul', 'Gloomhaven',
    ],
    'Jeu de rôle': ['Donjons & Dragons', "L'Appel de Cthulhu", 'Pathfinder', 'Vampire : la Mascarade'],
    'Wargame & Figurines': ['Warhammer 40,000', 'Age of Sigmar', 'Blood Bowl', 'Bolt Action'],
    "Jeu d'ambiance": ['Loup-Garou', "Time's Up", 'Blanc-Manger Coco', 'Skull King'],
  },
  Esport: {
    MOBA: ['League of Legends', 'Dota 2'],
    FPS: ['Counter-Strike', 'Valorant', 'Overwatch'],
    'Jeu de combat': ['Street Fighter', 'Tekken', 'Super Smash Bros'],
    'Battle Royale': ['Fortnite', 'Apex Legends'],
    'Sport & Course': ['EA Sports FC', 'Rocket League'],
  },
  Musique: {
    'Musiques amplifiées': ['Rock', 'Pop', 'Rap/Hip-hop', 'Électro', 'Métal', 'Reggae'],
    'Jazz, Blues & Soul': ['Jazz', 'Blues', 'Soul', 'Funk', 'Gospel'],
    'Classique & Lyrique': ['Musique classique', 'Opéra', 'Baroque', 'Musique de chambre'],
    'Musiques du monde & trad.': ['Latino', 'Afrobeat', 'Celtique', 'Folk', 'Chanson française'],
  },
  'Spectacle vivant': {
    Théâtre: ['Comédie', 'Tragédie', "Théâtre d'impro"],
    Danse: ['Danse classique', 'Danse contemporaine', 'Danse hip-hop', 'Danses latines'],
    'Cirque & Arts de la rue': ['Cirque', 'Arts de la rue', 'Marionnettes'],
    Humour: ['Stand-up', 'Café-théâtre', 'Improvisation'],
  },
  Sport: {
    'Sports collectifs': ['Football', 'Basket-ball', 'Rugby', 'Handball', 'Volley-ball'],
    'Sports de raquette': ['Tennis', 'Padel', 'Badminton', 'Tennis de table'],
    'Sports de combat': ['Judo', 'Boxe', 'Karaté', 'MMA'],
    'Sports individuels': ['Athlétisme', 'Natation', 'Cyclisme', 'Escalade'],
    'Sports mécaniques': ['Automobile', 'Moto', 'Karting'],
    'Sports de glisse': ['Ski', 'Surf', 'Skateboard'],
  },
  Nature: {
    'Découverte nature': ['Randonnée', 'Observation de la faune', 'Botanique'],
    Animaux: ['Zoo', 'Aquarium', 'Ferme pédagogique'],
    'Jardinage & Permaculture': ['Potager', 'Compostage', 'Apiculture'],
  },
  Arts: {
    'Arts visuels': ['Peinture', 'Sculpture', 'Photographie', 'Illustration', 'Street art'],
    'Arts numériques': ['Art génératif', 'Motion design', 'Art vidéo'],
    "Artisanat d'art": ['Céramique', 'Verrerie', 'Bijouterie'],
  },
  Culture: {
    'Littérature & BD': ['Roman', 'Poésie', 'Bande dessinée', 'Manga'],
    'Idées & Société': ['Philosophie', 'Histoire des idées', 'Géopolitique'],
  },
  Patrimoine: {
    'Patrimoine bâti': ['Monument', 'Château', 'Site historique'],
    'Musées & Collections': ['Beaux-arts', 'Histoire', 'Archéologie'],
  },
  Cinéma: {
    Fiction: ['Drame', 'Comédie dramatique', 'Science-fiction', 'Horreur', 'Action', 'Thriller'],
    'Non-fiction & formats': ['Documentaire', 'Animation', 'Court-métrage', 'Série'],
  },
  Sciences: {
    'Sciences exactes': ['Astronomie', 'Physique', 'Mathématiques'],
    'Sciences du vivant': ['Biologie', 'Écologie', 'Médecine'],
  },
  Technologie: {
    Numérique: ['Développement', 'Intelligence artificielle', 'Cybersécurité', 'Web3'],
    'Hardware & Making': ['Robotique', 'Impression 3D', 'Fablab/DIY', 'VR/AR'],
  },
  Éducation: {
    'Formation pro.': ['Bureautique', 'Management', 'Langues'],
    'Orientation & Emploi': ['Métiers', 'Alternance', 'Reconversion'],
  },
  Business: {
    Entrepreneuriat: ['Startup', 'Levée de fonds', 'Innovation'],
    'Marketing & Vente': ['Growth', 'Social media', 'E-commerce'],
  },
  Lifestyle: {
    'Bien-être': ['Yoga', 'Méditation', 'Sophrologie'],
    'Mode & Maison': ['Mode', 'Cosmétique', 'Décoration'],
  },
  Gastronomie: {
    Cuisine: ['Cuisine française', 'Cuisine italienne', 'Cuisine japonaise', 'Street food', 'Végétarienne'],
    Boissons: ['Vin', 'Bière', 'Café', 'Cocktails', 'Spiritueux'],
    Sucré: ['Pâtisserie', 'Chocolat', 'Boulangerie'],
  },
  Tourisme: {
    'Découverte & Terroir': ['City tour', 'Route des vins', 'Patrimoine local'],
    'Plein air & Aventure': ['Écotourisme', 'Itinérance', 'Randonnée aventure'],
  },
  Solidarité: {
    'Entraide & Caritatif': ['Collecte alimentaire', 'Maraude', 'Bénévolat'],
    Sensibilisation: ['Environnement', 'Inclusion handicap', 'Cause animale'],
  },
};

// Axe C — ModalityDimension → Modalities (name de Modality unique global — DATA.01 §5).
const MODALITY_DIMENSIONS: Record<string, string[]> = {
  Participation: ['Présentiel', 'En ligne', 'Hybride'],
  Accès: ['Libre', 'Sur inscription', 'Sur invitation'],
  Tarification: ['Gratuit', 'Payant'],
  'Public visé': [
    'Tout public', 'Famille', 'Enfant', 'Adolescent', 'Étudiant', 'Senior', 'Professionnel',
    'Expert', 'Débutant',
  ],
  Accessibilité: ['PMR', 'Langue des signes', 'Audiodescription', 'Sous-titré'],
  Ambiance: ['Festif', 'Culturel', 'Éducatif', 'Caritatif', 'Convivial', 'Communautaire'],
  Rayonnement: ['Local', 'Régional', 'National', 'International'],
  "Nature de l'organisateur": ['Association', 'Collectivité', 'Entreprise', 'Particulier', 'Institution'],
  'Mode de jeu': ['Compétitif', 'Coopératif'],
  Durée: ['Permanent', 'Temporaire', 'Ponctuel', 'Récurrent'],
  Cadre: ['Intérieur', 'Extérieur'],
  "Formation d'équipe": ['Solo', 'Équipe'],
  'Format de jeu': ['Constructed', 'Draft', 'Scellé', 'Standard', 'Commander', 'Limité'],
};

export async function seedTaxonomyV2(prisma: PrismaClient): Promise<void> {
  // Familles + sujets rattachés aux activités généralistes existantes (Domain « Général »).
  const general = await prisma.domain.findUnique({ where: { name: 'Général' } });
  if (general) {
    for (const [activityName, families] of Object.entries(FAMILIES_SUBJECTS)) {
      const activity = await prisma.activity.findUnique({
        where: { domainId_name: { domainId: general.id, name: activityName } },
      });
      if (!activity) continue;
      for (const [familyName, subjects] of Object.entries(families)) {
        const family = await prisma.activityFamily.upsert({
          where: { activityId_name: { activityId: activity.id, name: familyName } },
          update: {},
          create: { name: familyName, activityId: activity.id },
        });
        for (const subjectName of subjects) {
          await prisma.subject.upsert({
            where: { familyId_name: { familyId: family.id, name: subjectName } },
            update: {},
            create: { name: subjectName, familyId: family.id },
          });
        }
      }
    }
  }

  // Dimensions + modalités.
  for (const [dimensionName, modalities] of Object.entries(MODALITY_DIMENSIONS)) {
    const dimension = await prisma.modalityDimension.upsert({
      where: { name: dimensionName },
      update: {},
      create: { name: dimensionName },
    });
    for (const modalityName of modalities) {
      await prisma.modality.upsert({
        where: { name: modalityName },
        update: { dimensionId: dimension.id },
        create: { name: modalityName, dimensionId: dimension.id },
      });
    }
  }
}
