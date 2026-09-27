import LegalPage from "../components/LegalPage";
import { ENTREPRISE, SITE, STOCKAGES } from "../lib/legal";

export const metadata = { title: "Cookies — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Traceurs" title="Cookies et stockages">
      <p>
        <strong>{SITE.nom} ne dépose aucun cookie.</strong> Pas de mesure d&apos;audience, pas de Google
        Analytics, pas de pixel publicitaire, pas de bouton de réseau social. C&apos;est pour cette raison
        qu&apos;aucune bannière de consentement ne s&apos;affiche : il n&apos;y a rien à consentir.
      </p>

      <h2>Ce que le site conserve dans votre navigateur</h2>
      <p>
        Deux informations techniques sont enregistrées localement, sur votre appareil uniquement. Elles ne
        sont jamais transmises à un tiers et ne permettent pas de vous suivre d&apos;un site à l&apos;autre.
        Elles relèvent des exceptions au consentement prévues par l&apos;article 82 de la loi Informatique
        et Libertés, car sans elles le service ne fonctionne pas.
      </p>
      {STOCKAGES.map((s) => (
        <p key={s.nom}>
          <strong>{s.nom}</strong> ({s.type}) — {s.finalite.toLowerCase()}. {s.categorie}. Durée :{" "}
          {s.duree.toLowerCase()}.
        </p>
      ))}

      <h2>Le module de paiement PayPal</h2>
      <p>
        PayPal est le seul tiers présent sur le site, et uniquement sur une page de galerie. Son module
        dépose ses propres cookies, nécessaires à la sécurité de la transaction et à la lutte contre la
        fraude.
      </p>
      <p>
        <strong>Il n&apos;est chargé qu&apos;au moment où vous demandez à payer</strong>, après avoir cliqué
        sur le bouton d&apos;achat. Tant que vous vous contentez de regarder votre galerie et de
        sélectionner vos photos, aucun script PayPal n&apos;est exécuté et aucun cookie PayPal n&apos;est
        déposé. Renoncer au paiement suffit donc à ne rien accepter.
      </p>
      <p>
        Le détail des traceurs de PayPal relève de sa propre politique, consultable sur{" "}
        <a href="https://www.paypal.com/fr/webapps/mpp/ua/cookie-full" className="link-underline text-ink" rel="noreferrer noopener" target="_blank">paypal.com</a>.
      </p>

      <h2>Comment les effacer</h2>
      <p>
        Ces stockages disparaissent lorsque vous videz les données du site dans votre navigateur. Pour
        l&apos;espace photographe, le bouton « Se déconnecter » supprime immédiatement le jeton de
        connexion. Les supprimer n&apos;abîme rien : il faudra simplement vous reconnecter, ou ressaisir le
        mot de passe de la galerie.
      </p>

      <h2>Une question</h2>
      <p>
        Écrivez à{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a>.
        Voir aussi notre{" "}
        <a href="/confidentialite" className="link-underline text-ink">politique de confidentialité</a>.
      </p>
    </LegalPage>
  );
}
