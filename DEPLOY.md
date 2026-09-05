# Mettre Track.Art en ligne (trak.art)

Tout est prêt côté code : Dockerfiles, migrations automatiques, sonde `/health`, stockage R2 et PayPal live commutables par variables d'environnement. Il reste à créer les comptes chez les prestataires et à coller les clés. Compter 1 à 2 heures la première fois.

## 0. Ce qu'il faut créer (comptes)
| Service | Rôle | Gratuit pour démarrer |
|---|---|---|
| GitHub | héberger le code | oui |
| Railway.app | faire tourner backend + frontend + PostgreSQL | crédit d'essai puis ~5 $/mois |
| Cloudflare R2 | stocker les photos (privé) | 10 Go gratuits |
| PayPal Developer | paiements | oui |
| Brevo (ou Resend) | emails (lien, rappel, confirmation) | 300 emails/jour gratuits |
| Registrar du domaine trak.art | DNS | domaine déjà acheté |

## 1. Pousser le code sur GitHub
```powershell
cd C:\Users\gamer\Desktop\track-art
git remote add origin https://github.com/<TON_USER>/track-art.git
git push -u origin main
```

## 2. PayPal (10 min)
1. https://developer.paypal.com → Apps & Credentials → **Sandbox** → Create App → copier *Client ID* et *Secret*.
2. Backend : `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`. Frontend : `PAYPAL_CLIENT_ID` (même valeur).
3. Tester un achat avec un compte acheteur sandbox (onglet *Testing tools → Sandbox accounts*).
4. Pour encaisser réellement : refaire la même chose dans l'onglet **Live** et passer `PAYPAL_MODE=live`.
5. Optionnel : Webhooks → ajouter `https://api.trak.art/payments/webhook` (événement `PAYMENT.CAPTURE.COMPLETED`) → `PAYPAL_WEBHOOK_ID`.

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
