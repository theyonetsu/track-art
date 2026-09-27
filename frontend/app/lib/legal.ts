/**
 * Identité légale et cartographie des traitements.
 *
 * TOUT ce qui est propre à l'entreprise est réuni ici : les pages légales
 * (mentions, confidentialité, cookies, CGU/CGV, remboursement) lisent ce fichier
 * et rien d'autre. Compléter les valeurs marquées À COMPLÉTER suffit à mettre
 * les cinq pages à jour d'un coup.
 *
 * Rien ici n'est inventé : les sous-traitants listés sont ceux réellement
 * appelés par le code (Railway, Cloudflare R2, PayPal, l'envoi SMTP), et les
 * durées de conservation correspondent aux tâches planifiées du backend.
 */

/** Passe à true une fois les champs « À COMPLÉTER » renseignés. */
export const IDENTITE_COMPLETE = false;

export const ENTREPRISE = {
  /** Micro-entreprise : l'éditeur est une personne physique, son nom est obligatoire (LCEN art. 6 III-1 a). */
  nom: "À COMPLÉTER — prénom et nom de l'exploitant",
  formeJuridique: "Entrepreneur individuel (micro-entreprise)",
  siret: "À COMPLÉTER — numéro SIRET à 14 chiffres",
  adresse: "À COMPLÉTER — adresse déclarée de l'entreprise",
  /** Le directeur de la publication est l'exploitant lui-même en entreprise individuelle. */
  directeurPublication: "À COMPLÉTER — prénom et nom de l'exploitant",
  email: "contact@trackart.fr",
  /** Micro-entreprise en franchise en base : pas de TVA facturée (CGI art. 293 B). */
  tva: "TVA non applicable, article 293 B du CGI",
  /** Ville dont dépendent les tribunaux : celle du siège. */
  ville: "À COMPLÉTER — ville du siège",
} as const;

export const SITE = {
  nom: "Track.Art",
  domaine: "trackart.fr",
  url: "https://trackart.fr",
} as const;

/** Sous-traitants au sens de l'article 28 du RGPD, tels qu'appelés par le code. */
export const SOUS_TRAITANTS = [
  {
    nom: "Railway Corporation",
    role: "Hébergement de l'application et de la base de données",
    donnees: "Comptes photographes, galeries, coordonnées des clients, paiements",
    pays: "États-Unis",
    garantie: "Clauses contractuelles types de la Commission européenne",
  },
  {
    nom: "Cloudflare, Inc. (stockage R2)",
    role: "Stockage des fichiers photo (originaux, aperçus, versions filigranées)",
    donnees: "Photographies déposées par le photographe",
    pays: "Union européenne (juridiction R2 « EU »)",
    garantie: "Données conservées dans l'Union européenne",
  },
  {
    nom: "PayPal (Europe) S.à r.l. et Cie, S.C.A.",
    role: "Encaissement des paiements des clients",
    donnees: "Montant, référence de commande, données de paiement saisies directement chez PayPal",
    pays: "Luxembourg",
    garantie: "Responsable de traitement autonome pour les données bancaires",
  },
] as const;

/** Durées réellement appliquées par les tâches planifiées du backend. */
export const CONSERVATION = [
  {
    quoi: "Galerie et photographies associées",
    duree: "Supprimées automatiquement à l'expiration de la galerie, fixée par le photographe à compter de la première ouverture du lien (30 jours par défaut, prolongeable)",
  },
  {
    quoi: "Compte photographe et ses réglages",
    duree: "Conservés tant que le compte existe, supprimés sur demande",
  },
  {
    quoi: "Coordonnées du client renseignées par le photographe",
    duree: "Supprimées avec la galerie correspondante",
  },
  {
    quoi: "Paiements (montant, date, référence PayPal)",
    duree: "10 ans, obligation comptable (Code de commerce, art. L123-22)",
  },
] as const;

/** Stockages navigateur réellement posés par le site. Aucun cookie, aucun traceur. */
export const STOCKAGES = [
  {
    nom: "token",
    type: "localStorage",
    finalite: "Maintenir la connexion du photographe à son espace",
    categorie: "Strictement nécessaire",
    duree: "Jusqu'à la déconnexion ou l'effacement des données du navigateur",
  },
  {
    nom: "gallery-<identifiant>",
    type: "localStorage / sessionStorage",
    finalite: "Éviter de redemander le mot de passe de la galerie à chaque page",
    categorie: "Strictement nécessaire",
    duree: "Jusqu'à l'expiration de la galerie ou l'effacement des données du navigateur",
  },
] as const;
