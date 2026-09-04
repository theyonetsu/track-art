# Track.Art — charte visuelle « Atelier » (validée le 4 septembre 2026)

Direction retenue : chaude, épurée, haut de gamme. Fond beige, typographie serif élégante pour les titres, sans-serif fine pour le texte. Jamais de noir plat. Discours ouvert à tous les photographes (pas seulement mariage) : Track.Art est une plateforme que n'importe quel photographe utilise, avec une commission sur les ventes.

## Couleurs (à déclarer dans `frontend/app/globals.css` via `@theme` Tailwind v4)
- `--color-sand: #EFE6DA` — fond principal (beige)
- `--color-sand-deep: #E6DACB` — fond secondaire, cartes, bandeaux
- `--color-ink: #221B18` — texte principal, boutons pleins
- `--color-ink-soft: #4F423C` — texte secondaire
- `--color-muted: #7C6C62` — légendes, métadonnées
- `--color-line: #D3C3B3` — bordures fines (1px)
- `--color-terracotta: #9E4F37` — accent unique : liens actifs, sélection, compteurs, le point du logo
- `--color-terracotta-soft: #C4877B` — hover / états légers
- Variante sombre « Soirée » (optionnelle, pour la galerie client si le photographe le choisit plus tard) : fond `#1E1614`, texte `#F3EAE0`, accent champagne `#C9A96E`.

## Typographie (Google Fonts via `next/font/google`)
- Titres : **Cormorant Garamond** (400/500, italique pour les mots mis en valeur), grandes tailles, `letter-spacing: -0.01em`, `line-height: 1.02–1.1`.
- Texte et UI : **Jost** (300/400/500). Corps 16–18px en 300, labels 12–13px en majuscules espacées (`tracking 0.14–0.3em`).
- Logo : « TRACK.ART » en Cormorant, `tracking 0.32em`, le point en terracotta.

## Règles de composition
- Marges généreuses : 80px de côté sur desktop, 20–24px sur mobile. Sections séparées par des filets 1px `line`, pas par des blocs colorés.
- Boutons : rectangulaires (pas d'arrondi), texte 12–13px majuscules espacées. Primaire = fond `ink` texte `sand` ; accent = fond `terracotta` ; secondaire = texte souligné 1px.
- Champs : fond transparent, bordure 1px `line`, focus bordure `ink`. Pas d'ombres portées.
- Photos : grille 2 colonnes mobile / 3–4 desktop, gap 8–16px, hauteurs variées (masonry). Sélection = contour 2px terracotta + pastille ronde terracotta avec coche SVG (jamais d'emoji).
- Icônes : SVG inline trait 1.5–2px, jamais d'emoji.
- Compteurs et expiration en terracotta (« 12 / 30 incluses », « Expire dans 23 jours »).
- Animations douces uniquement (opacité / translation 200–300ms). Mobile-first.

## Écrans à habiller (tous existent déjà en Tailwind)
1. `app/page.tsx` — accueil trak.art : header (logo, Fonctionnement / Tarifs / Exemples, Connexion, « Essayer gratuitement »), hero « Des galeries clients aussi belles que vos photos. » + sous-titre + 2 CTA, bandeau citation avec emplacements `[NOM DU PHOTOGRAPHE] · [VILLE]`, 3 étapes numérotées 01/02/03 (Vous déposez les photos / Vos clients choisissent / Vous êtes payé), footer.
2. `app/admin/login/page.tsx` — même système, formulaire centré.
3. `app/admin/dashboard/page.tsx` et `app/admin/gallery/[id]/page.tsx` — tableau de bord sobre, cartes sur `sand-deep`, liens d'action en majuscules espacées.
4. `app/g/[slug]/GalleryClient.tsx` — galerie client : en-tête centré (logo, titre en Cormorant, date), barre compteur/expiration entre deux filets, grille photos, barre d'action fixe en bas (fond sand 96%, bouton « Confirmer » plein ink).
5. `app/not-found.tsx` et page « galerie expirée ».
