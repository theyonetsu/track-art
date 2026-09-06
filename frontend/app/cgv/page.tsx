import LegalPage from "../components/LegalPage";

export const metadata = { title: "Conditions générales — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Conditions générales" title="Conditions générales d’utilisation et de vente">
      <p className="help">Version du [DATE]. Ce texte est un modèle à faire relire par un professionnel du droit avant mise en ligne. Les crochets sont à compléter.</p>
      <h2>1. Objet</h2>
      <p>Track.Art (« la Plateforme »), éditée par [RAISON SOCIALE], met à disposition des photographes professionnels (« Photographes ») un service de galeries privées permettant à leurs clients (« Clients ») de sélectionner des photographies, d’acheter des photographies supplémentaires ou des prolongations, et de télécharger des fichiers haute définition.</p>
      <h2>2. Comptes photographes</h2>
      <p>L’ouverture d’un compte est gratuite et sans engagement. Le Photographe est seul responsable des contenus qu’il publie, des prix qu’il fixe et des informations qu’il communique à ses Clients. Il garantit détenir les droits nécessaires sur les photographies déposées.</p>
      <h2>3. Prix et commission</h2>
      <p>La Plateforme ne facture aucun abonnement. Sur chaque paiement effectué par un Client (photographies supplémentaires, forfait « toutes les photos », prolongation), la Plateforme prélève une commission de [COMMISSION] % du montant TTC. Le taux applicable est affiché dans l’espace du Photographe au moment de la vente. Le solde est reversé au Photographe [MODALITÉS : périodicité, moyen, seuil].</p>
      <h2>4. Paiements</h2>
      <p>Les paiements sont traités par PayPal. La Plateforme ne conserve aucune donnée bancaire. Le déblocage des fichiers intervient après confirmation du paiement par PayPal.</p>
      <h2>5. Durée de disponibilité des galeries</h2>
      <p>Chaque galerie est accessible pendant la durée fixée par le Photographe à compter de la première ouverture par le Client, prolongeable. À l’expiration, la galerie et l’ensemble des fichiers associés sont supprimés définitivement. Il appartient au Client de télécharger ses fichiers avant cette date ; le Photographe conserve ses originaux par ses propres moyens.</p>
      <h2>6. Propriété intellectuelle</h2>
      <p>Les photographies restent la propriété du Photographe. L’achat d’une photographie par un Client lui confère un droit d’usage privé, sauf mention contraire convenue avec le Photographe. Toute reproduction des aperçus filigranés est interdite.</p>
      <h2>7. Droit de rétractation</h2>
      <p>Conformément à l’article L221-28 du Code de la consommation, le droit de rétractation ne s’applique pas aux contenus numériques fournis immédiatement après paiement avec l’accord exprès du Client, ce que le Client accepte en validant son paiement.</p>
      <h2>8. Responsabilité</h2>
      <p>La Plateforme s’engage à des moyens raisonnables de disponibilité et de sécurité. Elle ne saurait être tenue responsable des contenus publiés par les Photographes ni des litiges entre Photographes et Clients, pour lesquels elle peut néanmoins être contactée à contact@trak.art.</p>
      <h2>9. Données personnelles</h2>
      <p>Voir notre <a href="/confidentialite" className="link-underline text-ink">politique de confidentialité</a>.</p>
      <h2>10. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français. Tout litige relève des tribunaux compétents de [VILLE].</p>
    </LegalPage>
  );
}
