import LegalPage from "../components/LegalPage";
import { CONSERVATION, ENTREPRISE, SITE, SOUS_TRAITANTS } from "../lib/legal";

export const metadata = { title: "Confidentialité — Track.Art" };

const TRAITEMENTS = [
  {
    finalite: "Créer et gérer le compte d'un photographe",
    donnees: "Adresse email, mot de passe (chiffré, jamais lisible), prénom et nom, nom du studio, téléphone et site web s'ils sont renseignés",
    base: "Exécution du contrat",
  },
  {
    finalite: "Envoyer au client le lien de sa galerie et les rappels d'expiration",
    donnees: "Coordonnées du client saisies par le photographe : prénom et nom, email, téléphone, date de la séance",
    base: "Intérêt légitime du photographe à livrer ses photographies",
  },
  {
    finalite: "Afficher la galerie et enregistrer la sélection du client",
    donnees: "Photographies déposées, photos sélectionnées, date de première ouverture du lien",
    base: "Exécution du contrat",
  },
  {
    finalite: "Encaisser un paiement et débloquer les fichiers",
    donnees: "Montant, type d'achat, date, référence de transaction PayPal",
    base: "Exécution du contrat et obligation comptable",
  },
  {
    finalite: "Sécuriser l'accès à l'espace photographe",
    donnees: "Empreinte de double authentification si le photographe l'active",
    base: "Intérêt légitime à protéger les comptes",
  },
] as const;

export default function Page() {
  return (
    <LegalPage eyebrow="Vos données" title="Politique de confidentialité">
      <p>
        {SITE.nom} est un service de galeries photo privées. Deux personnes différentes y confient des
        données : le <strong>photographe</strong>, qui ouvre un compte, et son <strong>client</strong>, dont
        le photographe renseigne les coordonnées pour lui envoyer sa galerie. Cette page décrit ce qui est
        réellement collecté, pourquoi, par qui c&apos;est vu et pendant combien de temps.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {ENTREPRISE.nom}, {ENTREPRISE.adresse}. Pour toute question ou demande relative à vos données :{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a>.
      </p>
      <p>
        Pour les photographies et les coordonnées de ses clients, le photographe est responsable du
        traitement et {SITE.nom} agit comme sous-traitant : c&apos;est lui qui décide quelles photos déposer
        et à qui envoyer le lien.
      </p>

      <h2>Ce que nous collectons, et pourquoi</h2>
      {TRAITEMENTS.map((t) => (
        <p key={t.finalite}>
          <strong>{t.finalite}.</strong> {t.donnees}. Base légale : {t.base.toLowerCase()}.
        </p>
      ))}
      <p>
        Aucun autre champ n&apos;est demandé. Le téléphone, le site web et le nom du studio sont facultatifs.
        Nous ne collectons aucune donnée de navigation, aucune statistique d&apos;audience et aucun profil
        publicitaire.
      </p>

      <h2>Vos données bancaires</h2>
      <p>
        Nous ne les voyons jamais. Le numéro de carte, la date d&apos;expiration et le cryptogramme sont
        saisis dans une fenêtre appartenant à PayPal et ne transitent à aucun moment par nos serveurs. Nous
        ne conservons que le montant, la date et la référence de la transaction.
      </p>

      <h2>Qui d&apos;autre y a accès</h2>
      <p>
        Vos données ne sont ni vendues, ni louées, ni transmises à des tiers à des fins commerciales. Seuls
        interviennent les prestataires techniques indispensables au service :
      </p>
      {SOUS_TRAITANTS.map((s) => (
        <p key={s.nom}>
          <strong>{s.nom}</strong> — {s.role.toLowerCase()} ({s.pays}). {s.donnees}. {s.garantie}.
        </p>
      ))}
      <p>
        Un photographe ne voit que ses propres galeries et ses propres clients. L&apos;administrateur de la
        plateforme accède aux données de facturation agrégées et, pour les besoins du support, aux comptes
        photographes ; il n&apos;ouvre pas les galeries sans motif.
      </p>

      <h2>Combien de temps nous les gardons</h2>
      {CONSERVATION.map((c) => (
        <p key={c.quoi}>
          <strong>{c.quoi}</strong> — {c.duree.charAt(0).toLowerCase() + c.duree.slice(1)}.
        </p>
      ))}
      <p>
        La suppression d&apos;une galerie expirée est définitive et porte sur les trois versions de chaque
        fichier : l&apos;original, l&apos;aperçu et la version filigranée.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation,
        d&apos;opposition et de portabilité sur vos données, ainsi que du droit de définir des directives
        sur leur sort après votre décès. Écrivez à{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a> :
        nous répondons sous un mois. Si vous êtes le client d&apos;un photographe, vous pouvez vous adresser
        indifféremment à lui ou à nous.
      </p>
      <p>
        Si la réponse ne vous satisfait pas, vous pouvez saisir la CNIL, 3 place de Fontenoy, TSA 80715,
        75334 Paris Cedex 07, ou déposer une plainte en ligne sur{" "}
        <a href="https://www.cnil.fr/fr/plaintes" className="link-underline text-ink" rel="noreferrer noopener" target="_blank">cnil.fr</a>.
      </p>

      <h2>Sécurité</h2>
      <p>
        Les mots de passe sont stockés sous forme d&apos;empreinte bcrypt et ne peuvent pas être relus. Les
        galeries peuvent être protégées par un mot de passe choisi par le photographe. Les fichiers photo
        sont conservés dans un espace de stockage privé : aucun n&apos;est accessible par une adresse
        publique, chaque affichage ou téléchargement passe par un lien signé qui expire. Les échanges avec
        le site sont chiffrés en HTTPS.
      </p>

      <h2>Cookies et stockages</h2>
      <p>
        {SITE.nom} ne dépose aucun cookie et n&apos;utilise aucun traceur publicitaire ou statistique. Le
        détail des rares stockages techniques figure sur la{" "}
        <a href="/cookies" className="link-underline text-ink">page dédiée aux cookies</a>.
      </p>
    </LegalPage>
  );
}
