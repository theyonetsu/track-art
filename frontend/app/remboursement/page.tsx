import LegalPage from "../components/LegalPage";
import { ENTREPRISE, SITE } from "../lib/legal";

export const metadata = { title: "Remboursements — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Achats" title="Annulation et remboursement">
      <p>
        Sur {SITE.nom}, un client achète trois choses possibles : des photographies supplémentaires, le
        forfait qui débloque toutes les photos restantes, ou une prolongation de la durée de sa galerie.
        Tout est payé à l&apos;unité, il n&apos;y a ni abonnement ni engagement.
      </p>

      <h2>Le droit de rétractation et sa limite</h2>
      <p>
        Un achat en ligne ouvre normalement un délai de rétractation de quatorze jours. La loi prévoit une
        exception pour les contenus numériques fournis immédiatement : l&apos;article L221-28 13° du Code de
        la consommation. Elle ne s&apos;applique que si vous avez expressément demandé la livraison immédiate
        <em> et</em> reconnu que vous perdiez ainsi votre droit de rétractation.
      </p>
      <p>
        C&apos;est exactement ce qui se passe au moment du paiement : la mention vous est présentée avant que
        vous ne validiez, et vos fichiers sont débloqués dans la seconde qui suit. Une fois les photos
        débloquées, l&apos;achat est donc définitif.
      </p>
      <p>
        <strong>Tant que vous n&apos;avez pas payé, rien n&apos;est engagé.</strong> Vous pouvez modifier
        votre sélection autant de fois que vous le souhaitez.
      </p>

      <h2>Les cas où nous remboursons</h2>
      <p>
        L&apos;exception ci-dessus ne couvre pas les défauts du service. Nous remboursons intégralement,
        sans discussion, dans les situations suivantes :
      </p>
      <p>
        <strong>Le paiement a été débité sans que les photos soient débloquées.</strong> C&apos;est le cas
        le plus fréquent : une coupure au mauvais moment. Signalez-le, nous vérifions la transaction et
        nous débloquons les fichiers ou nous remboursons.
      </p>
      <p>
        <strong>Vous avez été débité deux fois pour le même achat.</strong> Le doublon est remboursé.
      </p>
      <p>
        <strong>Les fichiers livrés sont inexploitables</strong> — corrompus, vides, ou sans rapport avec la
        galerie achetée.
      </p>
      <p>
        <strong>La galerie est devenue inaccessible par notre faute</strong> avant la fin de sa durée de
        validité, et nous n&apos;avons pas pu la rétablir.
      </p>
      <p>
        <strong>Une prolongation achetée n&apos;a pas été appliquée.</strong>
      </p>

      <h2>Les cas où nous ne remboursons pas</h2>
      <p>
        Un changement d&apos;avis sur des photos correctement livrées et téléchargeables. Une galerie
        expirée faute d&apos;avoir téléchargé les fichiers à temps, alors que la date d&apos;expiration est
        affichée en permanence et rappelée par email. Un désaccord sur le contenu des photographies ou sur
        la prestation du photographe : cette relation-là vous lie à lui, pas à nous — mais écrivez-nous
        quand même, nous ferons le lien.
      </p>

      <h2>Comment demander</h2>
      <p>
        Écrivez à{" "}
        <a href={`mailto:${ENTREPRISE.email}?subject=Demande%20de%20remboursement`} className="link-underline text-ink">{ENTREPRISE.email}</a>{" "}
        en indiquant l&apos;adresse email utilisée pour le paiement, la date, le montant et ce qui
        s&apos;est passé. La référence PayPal, si vous l&apos;avez, accélère les choses.
      </p>
      <p>
        Nous accusons réception sous 48 heures ouvrées et tranchons sous 14 jours. Le remboursement accepté
        est effectué par le même moyen de paiement, généralement sous 5 jours ouvrés ; le délai
        d&apos;apparition sur votre relevé dépend ensuite de votre banque.
      </p>

      <h2>Si nous ne trouvons pas d&apos;accord</h2>
      <p>
        Vous pouvez recourir gratuitement à un médiateur de la consommation, ou saisir la plateforme
        européenne de règlement en ligne des litiges sur{" "}
        <a href="https://ec.europa.eu/consumers/odr" className="link-underline text-ink" rel="noreferrer noopener" target="_blank">ec.europa.eu/consumers/odr</a>.
        Les <a href="/cgv" className="link-underline text-ink">conditions générales</a> précisent le cadre applicable.
      </p>
    </LegalPage>
  );
}
