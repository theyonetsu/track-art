# Track.Art — état du projet (mis à jour le 4 septembre 2026)

> Fichier de mémoire pour reprendre le travail avec Claude sans repartir de zéro :
> coller le contenu de ce fichier (ou dire « lis PROJET.md ») en début de conversation.

## Ce que c'est
SaaS de galeries photo pro (style Pixieset) : admin photographe → galerie → lien client → sélection incluse (15/30/60) → extras via PayPal → téléchargement HD. Expiration 30 j après première ouverture, purge automatique à 3 h. Domaine cible : trak.art.

## Stack
NestJS 10 + Prisma 5 + PostgreSQL · Next.js 16 + React 19 + Tailwind 4 · MinIO local / Cloudflare R2 prod · PayPal v2 (sandbox) · Docker Compose · cible Railway.
Dossier : `C:\Users\gamer\Desktop\track-art` (backend/, frontend/, docker-compose.yml).

## Fait (MVP)
- Auth admin JWT (12 h) + 2FA TOTP (setup/verify existent, pas encore forcé au login).
- Dashboard admin : créer / gérer / supprimer galerie, copier le lien, envoyer par email, upload multiple, prix par photo, réglages globaux (prix extension, durée, prix photo extra).
- Upload → preview 1200 px + version filigranée (sharp), stockage privé, URLs signées 10 min, bucket auto-créé au démarrage.
- Galerie client : grille, lightbox, sélection incluse/extras, confirmation gratuite (`POST /galleries/:slug/confirm-selection`), paiement PayPal des extras, téléchargement HD, compteur d'expiration, clic droit / drag bloqués.
- Cron : rappel d'expiration J-3 (8 h) et purge (3 h).
- Compilation backend + frontend vérifiée (tsc + eslint OK).

## Fait le 4 sept. (après-midi)
- Bug 500 sur routes protégées corrigé (JwtStrategy non enregistrée). API proxifiée en `/api` par Next (`NEXT_PUBLIC_API_URL=/api`).
- Lancement local validé : Docker, migration, seed, backend, frontend, login, création de galerie OK.
- Charte visuelle « Atelier » validée par Yonetsu → voir `DESIGN.md`. Les maquettes sont dans l'artefact Claude « Track.Art Directions visuelles ».

## Fait le 4 sept. (soirée, en autonomie)
- Charte Atelier appliquée sur TOUT le frontend (accueil, login, dashboard, gestion galerie, galerie client, 404, expirée, skeleton). Fonts via next/font (Cormorant Garamond + Jost), tokens dans `globals.css` (@theme), composants `.btn` / `.input` / `.label`, `app/components/Logo.tsx`.
- Bug upload corrigé : `sharp` importé en CommonJS (`require`) — `import * as sharp` n'était pas appelable.
- Parcours client testé de bout en bout dans le navigateur : upload de 5 images → lien client → expiration déclenchée à la 1re ouverture → sélection de 3 photos → confirmation gratuite → 3 photos HD téléchargeables, quota passé à 27.
- Extras payants : le flux arrive jusqu'à PayPal ; identifiants `.env` encore factices → réponse 503 explicite « PayPal non configuré » (plus de 500).
- URLs signées : 1 h (au lieu de 10 min) pour éviter les images cassées si le client reste longtemps sur la page.

## Fait le 4 sept. (nuit)
- Previews protégées : composant `ProtectedImage` (arrière-plan CSS + calque, plus de balise <img>, clic droit / drag / appui long bloqués). Une capture d'écran reste possible → la basse définition (1200 px) reste la vraie protection. Ne pas promettre d'« anti-IA ».
- Textes de l'accueil réécrits (ton pro, bandeau 4 atouts, tarif « commission uniquement »). Classes `.btn/.input/.label` passées en `@layer components` (sinon elles écrasaient les utilitaires Tailwind).
- Yonetsu a confirmé que les photos s'affichent bien dans Chrome.

## Fait le 5 sept. (relief + animations, en autonomie)
- Système de relief : ombres chaudes superposées (`--shadow-soft/lift/deep`), `.card` / `.card-hover` / `.tile`, boutons avec dégradé, lift au survol et état pressé, champs avec inset, header `.glass`, grain très léger (`.grain`).
- Animations : `Reveal` (apparition au défilement, IntersectionObserver, avec stagger), `fade-up`, `slide-up` (drawer, barre d'action), `float`, respect de `prefers-reduced-motion`.
- Accueil : `HeroStack` (collage de 3 tirages superposés, inclinaison 3D qui suit la souris, carte flottante), sections Fonctionnement / Exemples (maquette téléphone `PhoneMock`) / Atouts / Tarifs en cartes, header collant et footer (`SiteHeader`, `SiteFooter`). Tous les liens mènent quelque part : ancres, /contact, /mentions-legales, /confidentialite (textes avec crochets à remplir).
- Galerie client : couverture avec la 1re photo floutée en fond, tuiles en relief, loupe au survol, lightbox avec flèches, clavier (← → Échap) et compteur, drawer et barre d'action animés.
- Admin : cartes en relief, header verre, liste des galeries en cartes.
- Inspiration : Pixieset (effet « ça a l'air cher » : couverture, sobriété, vitesse) + tendances 2026 (ombres douces, collage, scroll reveal, micro-interactions).
- Limite connue : `/g/<slug-inconnu>` renvoie la page 404 mais avec un statut HTTP 200 (streaming dû à `loading.tsx`), sans impact utilisateur.

## Fait le 5 sept. (version « plateforme », en autonomie)
- **Modèle** : `User` (rôle PHOTOGRAPHER/SUPERADMIN, nom, studio, téléphone, site, filigrane, valeurs par défaut), `Gallery` (userId, clientName, eventDate, message, maxSelection libre, overrides prix/prolongation, expiryDays, password bcrypt, allowHdDownload, coverPhotoId, isArchived), `Photo` (filename, width/height, sortOrder), `Payment` (userId, commissionRate, platformFee, netAmount), `Settings.commissionRate`. Migration `20260905090000_photographers_and_gallery_options` (à appliquer : `npx prisma migrate dev`).
- **Backend** : `POST /auth/register`, `POST /auth/change-password`, `GET/PATCH /me`, `GET /admin/users` (super-admin), galeries scopées par photographe (`/galleries/manage/:id/*` : update, send-link, reset-expiry, extend, delete), mot de passe galerie (`POST /galleries/:slug/access` → jeton `x-gallery-token` 14 j), photos (cover auto, lock/unlock, reorder, prix), paiements avec commission + `create-extension-order` + `GET /payments/mine`, filigrane au nom du studio, emails aux couleurs Atelier.
- **Frontend** : `/inscription`, `/admin/compte` (identité, filigrane, défauts, mot de passe, 2FA, stats), `/admin/ventes`, `/admin/plateforme` (super-admin), dashboard (nombre de photos libre, client, date, archivées), page galerie réécrite (informations, forfait & tarifs, accès & protection, validité, ventes, archivage, grille avec couverture/offrir/prix), galerie client (écran mot de passe, nom du studio, message, prolongation payante, HD conditionnel), `/aide` (FAQ complète), accueil sans mention de 15/30/60, bandeau d'images d'ambiance.
- **Typographie** : 3 familles — Cormorant (titres), Jost (texte), DM Mono (libellés, options, compteurs, badges, boutons). Classes `.eyebrow .label .meta .num .badge .field-label .help .subsection .switch`.
- **Visuels** : 8 images d'ambiance générées procéduralement dans `frontend/public/showcase/` (bokeh, fenêtre, bouquet, golden hour, voile, pellicule, nuit, bandeau). À remplacer par de vraies photos dès que Yonetsu en a (mêmes noms de fichiers).
- ⚠️ **À faire par Yonetsu avant de tester** : dans un nouveau terminal, `cd backend && npx prisma migrate dev` (le backend redémarre tout seul). Sans ça, l'API renvoie des erreurs sur les nouveaux champs.

## Fait le 5 sept. (après-midi, en autonomie)
- **Achat de toutes les photos** : `Gallery.allPhotosPrice` / `User.defaultAllPhotosPrice` (migration `20260905140000_all_photos_price`), `POST /payments/create-all-photos-order` (type `BuyAllPhotos`, déverrouille tout à la capture), bouton « Débloquer les N photos · X € » + « Tout sélectionner » côté client, champs côté admin (compte + galerie).
- **Téléchargement** (revu le 5 sept. au soir, sur demande de Yonetsu) : **plus d'archive ZIP**. Chaque photo se télécharge en fichier ORIGINAL, tel qu'uploadé (même format, même résolution, aucune recompression), avec son nom d'origine — l'URL signée porte un `Content-Disposition: attachment` (`ResponseContentDisposition` S3/R2), donc le fichier est directement utilisable sur ordinateur comme sur téléphone. Le bouton « Tout télécharger (N) » enchaîne les fichiers un par un (700 ms d'intervalle) avec un compteur de progression. Le code ZIP (`zip-stream.ts`, route `/zip`, `getObjectStream`) a été supprimé.
- **FR / EN / ES** : dictionnaire `app/g/[slug]/i18n.ts`, langue choisie par galerie (admin → Informations), dates et PayPal localisés. Testé en anglais.
- **Mise en ligne** : `DEPLOY.md` (pas à pas GitHub → PayPal → R2 → Brevo → Railway → domaine), `backend/.env.example`, `frontend/.env.example`, `GET /health` (db, paypal, smtp, storage), CORS multi-origines, `trust proxy`, écoute `0.0.0.0`.
- **CGV** : `/cgv` (modèle avec crochets), lien dans le footer et à l'inscription.
- ⚠️ **À faire par Yonetsu** : `cd backend && npx prisma migrate dev` (nouvelle migration `all_photos_price`), puis DEPLOY.md étapes 2 à 5 avec ses comptes.

## Fait le 5 sept. (nuit) — avis, carte bancaire, navigation
- **Avis** : composant `Testimonials` — 10 avis courts (prénom + ville, 5 étoiles) sur deux rangées qui défilent en sens inverse (CSS marquee, pause au survol, figé si `prefers-reduced-motion`). Remplace le gros bloc citation. **Avis illustratifs à remplacer par de vrais retours.**
- **Paiement par carte (Stripe Checkout)** : `POST /payments/stripe/create-session` (photos / all / extension) et `POST /payments/stripe/confirm` (vérifie `payment_status` + montant avant de déverrouiller), `GET /payments/methods` pour n'afficher que les moyens réellement configurés. Application du paiement factorisée dans `applyPayment()` (partagée PayPal / Stripe). Aucune dépendance ajoutée (API REST en form-urlencoded). Clé attendue : `STRIPE_SECRET_KEY`.
- Retour depuis Stripe géré dans la galerie (`?paiement=cs_...` → confirmation + bandeau + nettoyage de l'URL ; `?paiement=annule` → message).
- **Navigation** : bouton « ← Accueil » sur les pages de connexion et d'inscription.

- **Passe relief (5 sept., nuit)** : échelle d'ombres en 3 couches (contact + ambiante + arête haute éclairée), boutons avec enfoncement réel au clic, cartes et champs en profondeur, header qui se décolle au défilement, barre de progression de lecture (`ScrollFx`). Choix assumé : **pas** de bordures blanches/noires marquées, qui datent le design. Voir `DESIGN.md`.

## Audit mobile + finitions (5 sept., nuit)
Testé par itération sur 375 / 768 / 1024 / 1440 px, sur toutes les pages publiques et admin.
Corrigé :
1. **Navigation mobile absente** → menu (burger) dans `SiteHeader` avec les 4 sections + Connexion + CTA, croix animée, défilement de fond bloqué. Actif jusqu'à `lg` (le trou de navigation sur tablette est comblé).
2. **Actions invisibles au doigt** (le plus grave) : téléchargement d'une photo, loupe et actions photo admin n'apparaissaient qu'au survol → inaccessibles sur téléphone. Classes `.hover-only` / `.touch-only` / `.reveal-on-hover` pilotées par `@media (hover: none)`.
3. **Cibles tactiles < 44 px** dans les navigations et actions → `min-height: 44px` sur mobile (`nav a`, `nav button`, `footer nav a`, `.tap`).
4. **Erreur d'hydratation React** : `ScrollFx` écrivait `data-scrolled` sur le header géré par React → l'attribut est maintenant posé sur `:root`, CSS adapté.
5. **Débordement horizontal** du header admin à 768 px et des tableaux Ventes/Plateforme → nav admin en `lg:`, email masqué en dessous de `xl`, `.table-scroll`.
6. En-tête « Vos photos HD » + bouton « Tout télécharger » superposés sur mobile → passage en colonne.
7. Carte flottante du hero masquée sous `sm` (elle chevauchait les tirages).
8. Repli visuel si un aperçu ne charge pas (dégradé chaud au lieu d'un rectangle vide).
9. `viewport` + `theme-color` explicites ; ancres du header/footer en `<Link>` (plus de rechargement complet) ; refs PayPal ne sont plus mutées pendant le rendu.

Restrictions d'environnement (pas des bugs) : le navigateur intégré de Cowork bloque `localhost:9000`, donc les aperçus MinIO n'y apparaissent pas (ils s'affichent bien dans Chrome) ; `next build` ne peut pas tourner depuis la VM Linux (binaires SWC Windows) → **à lancer une fois côté Windows avant la mise en ligne** : `cd frontend && npm run build`.

## Session du 6 septembre — Réglages plateforme & navigation retour

### Réglages plateforme (super-admin)
`Settings` porte désormais **toutes** les valeurs par défaut de la plateforme — photos incluses, prix photo supplémentaire, **prix « toutes les photos »**, prolongation (prix + jours), validité — en plus de la commission. Elles s'appliquent à tout photographe qui n'a rien défini de son côté.

S'y ajoutent des **droits** accordés aux photographes, réglables depuis `/admin/plateforme` :
- `allowPricing` — fixer ses propres tarifs
- `allowExpiry` — fixer validité et durée de prolongation
- `allowAllPhotos` — proposer l'achat groupé
- encadrement : `priceMin` / `priceMax`, `maxExpiryDays`

Cascade appliquée dans `effectiveSettings` : **galerie → photographe → plateforme**, sauf si le droit correspondant est retiré, auquel cas la valeur plateforme s'impose à toutes les galeries, existantes comprises (aucune migration de données nécessaire, la surcharge est simplement ignorée). La validation est doublée côté écriture (`galleries.sanitize`, `users.updateMe`) pour qu'un appel API direct ne contourne pas les bornes.

`GET /settings/policy` (tout compte connecté) expose droits + valeurs par défaut ; `/admin/compte` et `/admin/gallery/[id]` grisent les champs verrouillés avec une pastille « Fixé par Track.Art » et n'envoient plus que les clés modifiables.

Migration : `20260906100000_platform_defaults_and_policy` — **à appliquer côté Windows** (`cd backend && npx prisma migrate dev`).

### Navigation retour (audit complet)
Chaque page a désormais une sortie explicite :
- pages légales, contact, aide → composant `BackLink` (« ← Accueil ») en haut de contenu
- espace photographe → lien « ← Site » dans l'en-tête (et dans la nav mobile), **Plateforme** ajouté à la nav mobile du super-admin (il était absent sous `lg`)
- galerie client → pied de page « ↑ Haut de page » + « Galerie privée propulsée par Track.Art » (FR/EN/ES), écran mot de passe → logo cliquable
- nouveaux `app/error.tsx` et `app/global-error.tsx` : un écran d'erreur ne peut plus être un cul-de-sac
- `/contact` : ancre `<a>` remplacée par `<Link>`
Déjà en place et vérifiés : `/admin/login`, `/inscription`, `not-found`, « ← Galeries » sur le détail d'une galerie.

## Audit de navigation du 6 septembre (clics réels dans le navigateur)

Vérifié : les 13 routes répondent, les 74 liens internes des pages publiques pointent tous vers une page qui existe, les trois ancres de l'accueil résolvent, la navigation client (Next Link) fonctionne, le menu téléphone s'ouvre, bloque le défilement de fond et se referme.

Corrigé :
1. **Aucun retour visuel pendant un changement de page.** C'était la vraie cause de la sensation de « site qui rame » : un clic sur un lien ne produisait rien de visible tant que la page suivante n'était pas prête. Nouveau composant `NavProgress` (barre fine en haut, animée, filet de sécurité à 12 s) monté dans le layout racine.
2. **`/admin` renvoyait 404.** Adresse pourtant naturelle à taper. Redirection vers `/admin/dashboard`, qui renvoie lui-même vers la connexion si aucun jeton.
3. **`/admin/gallery/<id inexistant>` restait bloqué sur « Chargement… »** avec un toast qui disparaissait au bout de 3 s : impasse totale. Écran d'erreur avec « ← Retour aux galeries » et « Réessayer ».
4. **Écrans galerie introuvable / expirée sans sortie** (pas d'en-tête, pas de bouton). Logo cliquable + bouton « Découvrir Track.Art ».
5. **Onglet du navigateur générique sur les galeries clients** (« Track.Art — Galeries photo… »). `generateMetadata` : titre = nom de la galerie, description au nom du studio, Open Graph pour l'aperçu quand le lien est envoyé par messagerie, et surtout **`noindex, nofollow`** — une galerie privée n'a rien à faire dans Google.
6. **Cibles tactiles sous 44 px** : logos d'en-tête et de pied de page, « Voir la galerie côté client », « Une question ? Écrivez-nous », « Déjà photographe ? », « Tout sélectionner », « Débloquer les N photos », croix de fermeture des tiroirs et de la visionneuse.
7. **La barre d'action flottante recouvrait le nouveau pied de galerie** quand une sélection était en cours.
8. Adresses `[EMAIL]` remplacées par `contact@trak.art` (CGV, confidentialité, contact, mentions légales).

Contrôlé après correction à 375, 768 et 1440 px : aucun débordement horizontal, plus aucune cible sous 44 px sur les pages publiques et la galerie client, `tsc` propre des deux côtés.

### Deuxième passe : animations et pages connectées

**Apparition au défilement** — trois causes cumulées à la saccade ressentie au premier défilement, toutes corrigées et vérifiées dans le navigateur :
- l'observateur ne s'attachait qu'après l'hydratation ; un bloc déjà atteint restait invisible puis apparaissait en fondu. `Reveal` vérifie désormais sa position au montage : déjà à l'écran → affiché tout de suite, et **sans transition** si l'utilisateur avait déjà défilé (classe `is-instant`).
- marge d'observation **négative** (−8 %) + seuil 12 % : le bloc n'apparaissait qu'une fois bien entré dans l'écran. Marge **positive** (+18 %) et seuil 0 → mesuré : un bloc situé 96 px sous la fenêtre est déjà à `opacity: 1`.
- transitions de 0,8–0,9 s et décalages jusqu'à 0,7 s → 0,45–0,5 s et 0,05 s ; déplacement de 24 → 14 px.

**Pages connectées (revue de code)** :
- `Ventes` : `catch(() => setRows([]))` affichait « Aucune vente pour l'instant » quand l'API échouait — le photographe croyait n'avoir aucune vente. État d'erreur distinct avec « Réessayer ».
- `Galeries` : `catch(() => {})` laissait un « Chargement… » perpétuel. Message d'erreur + reprise.
- `Plateforme` : statistiques indisponibles → page muette. Message d'erreur, état de chargement, et ligne « aucun compte » dans le tableau.
- Champ « Photos incluses » du formulaire de création aligné sur le reste (0 autorisé = vente à l'unité).

### Troisième passe : parcours connecté testé avec de vraies données

Testé en cliquant, connecté en super-admin : dashboard, ventes, compte, plateforme, détail de galerie, création d'une galerie à l'unité, envoi de 23 photos, ouverture côté client, suppression.

Vérifié bon : aucun débordement horizontal sur les cinq pages en 1440 et 375 px ; l'envoi découpé fonctionne (23 fichiers → 2 lots de 20 et 3, noms d'origine conservés, 23 photos en base) ; la galerie à 0 photo incluse affiche bien « Chaque photo est à X € » et 24 aperçus chargés ; `/settings/policy` sert les droits en direct ; le tableau de bord affiche les vraies données (2 galeries, 5 photos, 100 % de liens ouverts).

Corrigé :
- **« Actualisé à 06/09/2026 19:05 »** : `toLocaleDateString` imprime la date même quand on ne demande que l'heure. Helper `formatTime` ajouté.
- **« 1 comptes au total »** : accord au pluriel.
- **Paiements abandonnés éternellement « en attente »** — deux traînaient depuis des tests PayPal. Une fenêtre fermée laissait une ligne en attente pour toujours et polluait la page Ventes. Tâche `expireStalePayments` à 4 h : au-delà de 24 h, statut `abandoned`, affiché en grisé.
- **Forfait groupé plus cher que l'achat à l'unité** : découvert en conditions réelles (50 € le lot contre 23 × 2 € = 46 €). Alerte dans les réglages de la galerie — le client n'aurait aucune raison de choisir le forfait.
- **« 0/0 incluses utilisées »** remplacé par « vente à l'unité » dans l'en-tête de galerie.
- Cibles tactiles : « ← Galeries », en-têtes de tri du tableau plateforme, et zone de contact des interrupteurs élargie via `::before` (sans changer leur apparence).

Connu et assumé : les actions au survol d'une photo dans la grille admin font 36 px sur téléphone. Les agrandir recouvrirait la vignette ; c'est un outil de travail dense, pas la page vue par le client — celle-ci ne contient plus aucune cible sous 44 px.

Piège de configuration à connaître : la valeur par défaut **du compte** l'emporte sur celle de la plateforme (cascade galerie → photographe → plateforme). Le prix à 2 € observé pendant le test venait du `defaultExtraPhotoPrice` du compte super-admin, pas du réglage plateforme à 8 €.

Reste à vérifier en conditions réelles : paiement Stripe et PayPal de bout en bout (clés à renseigner) : tableau de bord, ventes, compte, plateforme, détail de galerie (parcours d'upload et d'options).

## Pas encore fait (par ordre de priorité)
0. **Appliquer la migration `platform_defaults_and_policy` puis tester** : inscription d'un 2e photographe, galerie avec mot de passe, message, nombre libre, prolongation offerte, page compte, ventes, plateforme.
1. **Créer une app PayPal Sandbox** (developer.paypal.com) et renseigner `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` dans `backend/.env` et `PAYPAL_CLIENT_ID` dans `frontend/.env.local`, puis tester l'achat d'extras.
1b. Vérifier sur le PC (Chrome) que les images des galeries s'affichent (le navigateur intégré de Claude bloque le port 9000 de MinIO, donc non vérifiable depuis Cowork) : `docker compose up -d`, `npx prisma migrate dev` (migration `photo_paid` à appliquer), seed, lancer les deux serveurs, parcours complet admin → client → PayPal sandbox.
2. Prolongation de galerie payante côté client (backend : model `Extension` existe, pas de route ni d'UI).
3. Multilingue FR / EN / ES (champ `languages` existe, UI en français uniquement).
4. Webhook PayPal : vérifier la signature (`PAYPAL_WEBHOOK_ID`) — aujourd'hui le déverrouillage passe par capture-order côté serveur, ce qui est sûr, mais le webhook n'est pas vérifié.
5. SMS Twilio (non branché), 2FA obligatoire au login, refresh token.
6. Support RAW (aujourd'hui JPEG/PNG/WEBP/HEIC/TIFF, 80 Mo max).
8. Reversement automatique aux photographes (PayPal Payouts) — aujourd'hui calcul de la part nette seulement, virements manuels.
9. Webhook PayPal signé (`PAYPAL_WEBHOOK_ID`) en plus de la capture serveur.
7. Déploiement Railway + R2 + domaine trak.art.

## Décisions prises
- Quota = photos `unlocked && !paid` ; extras marquées `paid=true`.
- Prix des extras = prix unitaire de chaque photo (modifiable par l'admin), pas un prix global.
- Fins de ligne : le repo contient un mélange CRLF/LF, sans impact.
