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

## Pas encore fait (par ordre de priorité)
1. **Créer une app PayPal Sandbox** (developer.paypal.com) et renseigner `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` dans `backend/.env` et `PAYPAL_CLIENT_ID` dans `frontend/.env.local`, puis tester l'achat d'extras.
1b. Vérifier sur le PC (Chrome) que les images des galeries s'affichent (le navigateur intégré de Claude bloque le port 9000 de MinIO, donc non vérifiable depuis Cowork) : `docker compose up -d`, `npx prisma migrate dev` (migration `photo_paid` à appliquer), seed, lancer les deux serveurs, parcours complet admin → client → PayPal sandbox.
2. Prolongation de galerie payante côté client (backend : model `Extension` existe, pas de route ni d'UI).
3. Multilingue FR / EN / ES (champ `languages` existe, UI en français uniquement).
4. Webhook PayPal : vérifier la signature (`PAYPAL_WEBHOOK_ID`) — aujourd'hui le déverrouillage passe par capture-order côté serveur, ce qui est sûr, mais le webhook n'est pas vérifié.
5. SMS Twilio (non branché), 2FA obligatoire au login, refresh token.
6. Support RAW (aujourd'hui JPEG/PNG/WEBP/HEIC/TIFF, 50 Mo max).
7. Déploiement Railway + R2 + domaine trak.art.

## Décisions prises
- Quota = photos `unlocked && !paid` ; extras marquées `paid=true`.
- Prix des extras = prix unitaire de chaque photo (modifiable par l'admin), pas un prix global.
- Fins de ligne : le repo contient un mélange CRLF/LF, sans impact.
