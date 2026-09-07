# Mettre Track.Art en ligne (trak.art)

Tout est prêt côté code : Dockerfiles, migrations automatiques, sonde `/health`, stockage R2 et PayPal live commutables par variables d'environnement. Il reste à créer les comptes chez les prestataires et à coller les clés. Compter 1 à 2 heures la première fois.

## 0. Ce qu'il faut créer (comptes)
| Service | Rôle | Gratuit pour démarrer |
|---|---|---|
| GitHub | héberger le code | oui |
| Railway.app | faire tourner backend + frontend + PostgreSQL | crédit d'essai puis ~5 $/mois |
| Cloudflare R2 | stocker les photos (privé) | 10 Go gratuits |
| Stripe | paiements par carte (recommandé) | oui, commission par transaction |
| PayPal Developer | paiements PayPal (optionnel) | oui |
| Brevo (ou Resend) | emails (lien, rappel, confirmation) | 300 emails/jour gratuits |
| Registrar du domaine trak.art | DNS | domaine déjà acheté |

## 0 bis. Ce qui est déjà prêt (vérifié le 7 septembre)

- `backend/Dockerfile` : installe, génère le client Prisma, compile, puis au démarrage `prisma migrate deploy && node dist/main.js` — les migrations passent toutes seules à chaque déploiement.
- `frontend/Dockerfile` : `npm ci`, build Next, `npm start`.
- `.dockerignore` à la racine et dans chaque service : ni `node_modules`, ni `.next`, ni `.env` dans les images.
- **Build de production vérifiée** : 16 routes générées, TypeScript propre. Le seul point qui a échoué en local est le téléchargement des polices Google, bloqué par le réseau de la machine de test — l'environnement de build Railway a un accès internet complet, ce point ne se posera pas.
- Sonde `/health` : renvoie l'état de la base, de PayPal, de Stripe, du SMTP et du stockage. À utiliser comme *healthcheck* Railway.

### Variables d'environnement à créer sur Railway

**Service backend**
| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (référence Railway) |
| `PORT` | `3001` |
| `APP_URL` | `https://trak.art` |
| `API_URL` | `https://api.trak.art` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `TOTP_ENCRYPT_KEY` | trois valeurs distinctes : `openssl rand -hex 32` |
| `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` | Cloudflare R2 (bascule automatique : dès que `R2_ENDPOINT` est défini, MinIO est ignoré) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` | `live` uniquement quand le compte Business est validé |
| `STRIPE_SECRET_KEY` | optionnel |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Brevo |

**Service frontend**
| Variable | Valeur |
|---|---|
| `API_URL` | URL interne du backend (`http://<service>.railway.internal:3001`) |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `PAYPAL_CLIENT_ID` | même valeur que le backend |

Les variables du frontend doivent être présentes **au moment du build** (Next les fige) : les définir avant le premier déploiement, sinon redéployer après les avoir ajoutées.

### Ordre de mise en ligne
1. Créer le projet Railway et y ajouter **PostgreSQL** en premier (le backend en dépend).
2. Déployer le **backend** depuis le dépôt (`backend/Dockerfile`), avec ses variables. Vérifier `/health`.
3. Déployer le **frontend**, avec `API_URL` pointant vers le backend interne.
4. Créer le bucket **R2** et brancher ses clés sur le backend, puis redéployer.
5. **Brevo** pour les emails, puis les DNS de `trak.art` (frontend) et `api.trak.art` (backend).
6. Créer le compte super-admin en production, changer son mot de passe, et supprimer les galeries de test.


## 1. Pousser le code sur GitHub
```powershell
cd C:\Users\gamer\Desktop\track-art
git remote add origin https://github.com/<TON_USER>/track-art.git
git push -u origin main
```

## 2. PayPal (15 min)

### a. Créer l'application sandbox
1. Aller sur **https://developer.paypal.com** → *Log in to Dashboard*. Un compte PayPal personnel suffit pour la sandbox ; **aucun compte Business n'est nécessaire tant qu'on ne passe pas en live**.
2. Menu **Apps & Credentials**, interrupteur **Sandbox** en haut (pas *Live*).
3. Une application `Default Application` existe déjà — la réutiliser, ou *Create App* (type **Merchant**), nom `Track.Art`.
4. Copier le **Client ID** et, après avoir cliqué sur *Show*, le **Secret**.

### b. Coller les clés (deux fichiers, la même valeur de Client ID)
`backend/.env` :
```
PAYPAL_CLIENT_ID=AeA1QI...
PAYPAL_CLIENT_SECRET=EO422d...
PAYPAL_MODE=sandbox
```
`frontend/.env.local` :
```
PAYPAL_CLIENT_ID=AeA1QI...
```
Le secret ne va **que** dans le backend : le frontend n'a besoin que du Client ID, qui est public par nature.

### c. Redémarrer les deux serveurs
Next.js et NestJS ne lisent leurs variables d'environnement **qu'au démarrage**. Sans redémarrage, le bouton PayPal reste absent et l'API répond 503.

### d. Récupérer un compte acheteur de test
Dashboard → **Testing Tools → Sandbox Accounts**. Deux comptes existent par défaut : un *Personal* (l'acheteur) et un *Business* (le vendeur). Ouvrir le compte Personal → *View/Edit account* pour voir l'email et changer le mot de passe si besoin. Cet identifiant sert à payer dans la fenêtre PayPal — **jamais le vrai compte PayPal**.

### e. Vérifier
`GET http://localhost:3001/health` doit renvoyer `paypal: "ok"`. Puis, dans une galerie côté client : sélectionner une photo au-delà du forfait → le bouton PayPal jaune doit apparaître à côté du bouton carte → payer avec le compte sandbox → la photo se déverrouille et la vente apparaît dans *Ventes*.

### f. Passer en réel (plus tard)
1. Le compte doit être un **compte PayPal Business** (gratuit, conversion depuis un compte personnel, vérification d'identité et RIB).
2. Même parcours, interrupteur **Live** → nouvelles clés (elles n'ont rien à voir avec celles de la sandbox).
3. `PAYPAL_MODE=live` et les clés live dans les deux fichiers.
4. Devise imposée par le code : **EUR**. Le compte doit pouvoir recevoir des euros.

### g. Webhook (optionnel, après mise en ligne)
Dashboard → l'application → *Webhooks* → *Add Webhook* → URL `https://api.trak.art/payments/webhook`, événement `PAYMENT.CAPTURE.COMPLETED` → copier le **Webhook ID** dans `PAYPAL_WEBHOOK_ID`. Le déverrouillage passe déjà par une capture côté serveur, donc c'est une sécurité supplémentaire, pas un prérequis.

### Pièges rencontrés
- **Clés sandbox utilisées avec `PAYPAL_MODE=live`** (ou l'inverse) → erreur d'authentification. Les deux jeux ne sont pas interchangeables.
- **Bouton PayPal invisible** → `PAYPAL_CLIENT_ID` absent de `frontend/.env.local`, ou frontend non redémarré.
- **503 « PayPal n'est pas encore configuré »** → clés absentes ou encore à `ton_paypal_client_id` dans `backend/.env`.
- **Payer avec son vrai compte PayPal en sandbox** → échec systématique : seuls les comptes sandbox fonctionnent.

## 2 bis. Stripe — carte bancaire (10 min)
1. Créer un compte sur https://dashboard.stripe.com (email + mot de passe, aucun statut particulier requis pour tester).
2. Laisser le tableau de bord en **mode test** (interrupteur en haut à droite) → Développeurs → Clés API → copier la **clé secrète** `sk_test_...`.
3. Backend : `STRIPE_SECRET_KEY=sk_test_...`. Rien à mettre côté frontend (le client est redirigé vers la page de paiement hébergée par Stripe).
4. Tester avec la carte `4242 4242 4242 4242`, n'importe quelle date future et n'importe quel CVC.
5. Pour encaisser réellement : activer le compte (identité, IBAN, statut d'entreprise ou auto-entrepreneur) puis remplacer par la clé `sk_live_...`.

## 3. Cloudflare R2 (10 min)
1. Cloudflare → R2 → Create bucket `trackart-photos` (**ne pas** activer l'accès public).
2. Manage R2 API Tokens → Create token (Object Read & Write) → copier *Access Key ID* et *Secret Access Key*.
3. Backend : `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET=trackart-photos`. Dès que `R2_ENDPOINT` est défini, MinIO est ignoré.

## 4. Emails (5 min)
Brevo → SMTP & API → copier hôte, port, login, clé SMTP. Backend : `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM="Track.Art <no-reply@trak.art>"`. Vérifier le domaine d'envoi (SPF/DKIM) dans Brevo pour ne pas finir en spam.

## 5. Railway (30 min)
1. New Project → **Deploy PostgreSQL**.
2. New → GitHub repo → track-art → service **backend** : Settings → Root Directory `/`, Dockerfile path `backend/Dockerfile`. Variables : tout `backend/.env.example` avec les vraies valeurs ; `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` ; `APP_URL=https://trak.art` ; `PORT=3001`. Healthcheck path : `/health`.
3. New → même repo → service **frontend** : Dockerfile path `frontend/Dockerfile`. Variables : `API_URL=https://api.trak.art`, `NEXT_PUBLIC_API_URL=/api`, `PAYPAL_CLIENT_ID`.
4. Networking : générer un domaine pour chaque service, puis Custom Domain : `api.trak.art` → backend, `trak.art` (et `www`) → frontend. Railway indique les enregistrements CNAME à créer chez le registrar.
5. Premier déploiement : le backend applique les migrations tout seul (`prisma migrate deploy`). Créer le super-admin une fois : onglet du service backend → *Shell* → `npm run seed` (ou définir `ADMIN_EMAIL`/`ADMIN_PASSWORD` avant).

## 6. Après la mise en ligne
- Se connecter, changer le mot de passe admin, régler la commission dans *Plateforme*.
- Remplir les crochets des pages Mentions légales, Confidentialité, CGV, Contact (`frontend/app/...`).
- Remplacer les visuels `frontend/public/showcase/*.webp` par de vraies photos (mêmes noms).
- Vérifier `https://api.trak.art/health` : `paypal: configured`, `smtp: configured`, `storage: r2`.
