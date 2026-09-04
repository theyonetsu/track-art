# Track.Art

SaaS de galeries photo pour photographes : le client reçoit un lien privé, choisit ses photos incluses dans son forfait (15 / 30 / 60), achète les extras via PayPal et télécharge les HD sans filigrane. La galerie expire 30 jours après la première ouverture.

## Lancer en local (Windows)

Prérequis : Node.js LTS, Docker Desktop (démarré), Git.

```powershell
cd C:\Users\gamer\Desktop\track-art

# 1. Base de données + stockage (PostgreSQL + MinIO)
docker compose up -d

# 2. Backend (NestJS) — terminal 1
cd backend
npm install
npx prisma migrate dev        # applique les migrations + régénère le client Prisma
npm run seed                  # crée l'admin : admin@track.art / ChangeMe123!
npm run start:dev             # http://localhost:3001

# 3. Frontend (Next.js) — terminal 2
cd ..\frontend
npm install
npm run dev                   # http://localhost:3000
```

Puis : http://localhost:3000/admin/login → créer une galerie → « Gérer » → uploader des photos → « Copier lien » → ouvrir le lien dans une fenêtre de navigation privée pour tester le parcours client.

Console MinIO (voir les fichiers stockés) : http://localhost:9001 (admin / admin123).

## Variables d'environnement

`backend/.env` (déjà présent) : `DATABASE_URL`, `JWT_ACCESS_SECRET`, `MINIO_*`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`, `SMTP_*` (vide = emails désactivés), `APP_URL`, `API_URL`.

`frontend/.env.local` : `API_URL` (utilisé côté serveur), `NEXT_PUBLIC_API_URL` (côté navigateur, défaut `http://localhost:3001`), `PAYPAL_CLIENT_ID`.

En production, remplacer MinIO par Cloudflare R2 : définir `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` (le backend bascule automatiquement sur R2 si `R2_ENDPOINT` est défini).

## Logique du forfait

- Chaque galerie a `maxSelection` photos incluses (15 / 30 / 60).
- Le client sélectionne librement ; les N premières sont incluses, les suivantes sont facturées au prix de chaque photo (modifiable par l'admin, défaut 2 €).
- Sélection sans extra → `POST /galleries/:slug/confirm-selection` (gratuit).
- Sélection avec extras → PayPal (`/payments/create-order` puis `/payments/capture-order`), déverrouillage automatique après capture.
- Les photos déverrouillées gratuitement sont `paid=false`, les extras `paid=true` : c'est ce qui permet de calculer le quota restant.

## Déploiement (Railway)

1. Pousser sur GitHub (`git push`).
2. Sur Railway : nouveau projet → ajouter PostgreSQL → deux services depuis le repo (root `backend/` et `frontend/`, chacun a son Dockerfile).
3. Renseigner les variables d'environnement ci-dessus (R2 à la place de MinIO, PayPal live, SMTP).
4. Commande de démarrage backend : `npx prisma migrate deploy && node dist/main.js`.
5. Pointer le domaine `trak.art` sur le service frontend, `api.trak.art` sur le backend, et mettre à jour `APP_URL` / `API_URL` / `NEXT_PUBLIC_API_URL`.
