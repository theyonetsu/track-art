import LegalPage from "../components/LegalPage";
import { ENTREPRISE, SITE } from "../lib/legal";

export const metadata = { title: "Conditions générales — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Conditions générales" title="Conditions générales d’utilisation et de vente">
      <h2>1. Objet et parties</h2>
      <p>
        {SITE.nom} (« la Plateforme »), éditée par {ENTREPRISE.nom}, met à disposition des photographes
        (« Photographes ») un service de galeries privées permettant à leurs clients (« Clients ») de
        consulter des photographies, d’en sélectionner un nombre inclus, d’en acheter davantage, d’acheter
        une prolongation et de télécharger des fichiers haute définition.
      </p>
      <p>
        Les présentes conditions s’appliquent à toute utilisation du site. Créer un compte ou valider un
        paiement vaut acceptation.
      </p>

      <h2>2. Compte photographe</h2>
      <p>
        L’ouverture d’un compte est gratuite, sans abonnement ni engagement de durée. Elle est réservée aux
        personnes majeures. Le Photographe fournit une adresse email valide et un mot de passe d’au moins
        huit caractères ; il en assure la confidentialité et peut activer une double authentification.
      </p>
      <p>
        Le Photographe est seul responsable des contenus qu’il dépose, des prix qu’il fixe dans les limites
        autorisées, et des informations qu’il communique à ses Clients. Il garantit détenir les droits sur
        les photographies déposées et avoir recueilli les autorisations nécessaires des personnes
        représentées.
      </p>
      <p>
        Il peut supprimer son compte à tout moment depuis son espace ; cette suppression entraîne celle de
        ses galeries et des fichiers associés.
      </p>

      <h2>3. Usages interdits</h2>
      <p>
        Sont notamment interdits : le dépôt de contenus illicites, violents, pornographiques ou portant
        atteinte à la dignité des personnes ; le dépôt de photographies de mineurs sans autorisation des
        titulaires de l’autorité parentale ; l’utilisation de la Plateforme comme simple espace de stockage
        sans rapport avec une livraison de séance ; toute tentative d’accès non autorisé, d’extraction
        automatisée ou de contournement des protections ; l’usurpation de l’identité d’un tiers.
      </p>

      <h2>4. Suspension et résiliation</h2>
      <p>
        En cas de manquement grave aux articles 2 ou 3, la Plateforme peut suspendre l’accès au compte.
        Sauf contenu manifestement illicite ou risque pour la sécurité du service, qui justifient une
        suspension immédiate, le Photographe est averti par email et dispose de sept jours pour se mettre en
        conformité ou contester. Une suspension n’affecte pas les sommes déjà dues au titre de ventes
        réalisées.
      </p>
      <p>
        Chaque partie peut mettre fin à la relation à tout moment. La Plateforme informe alors les
        Photographes concernés au moins trente jours à l’avance afin qu’ils puissent récupérer leurs
        données.
      </p>

      <h2>5. Prix et commission</h2>
      <p>
        La Plateforme ne facture aucun abonnement. Sur chaque paiement effectué par un Client, elle prélève
        une commission sur le montant payé. Le taux applicable est affiché dans l’espace du Photographe et
        rappelé sur chaque vente ; toute modification est notifiée au moins trente jours à l’avance et ne
        s’applique qu’aux ventes postérieures.
      </p>
      <p>
        Le solde revenant au Photographe lui est reversé selon les modalités convenues avec lui et
        rappelées dans son espace. Il lui appartient de déclarer ces revenus et d’acquitter les cotisations
        et impôts correspondants.
      </p>
      <p>Les prix affichés aux Clients sont exprimés en euros, toutes taxes comprises. {ENTREPRISE.tva}.</p>

      <h2>6. Achats des Clients et livraison</h2>
      <p>
        Le Client sélectionne gratuitement le nombre de photographies inclus dans le forfait défini par son
        Photographe. Au-delà, il peut acheter des photographies à l’unité, un forfait débloquant les photos
        restantes, ou une prolongation de la durée de sa galerie. Le récapitulatif et le montant total lui
        sont présentés avant validation.
      </p>
      <p>
        Les paiements sont traités par PayPal. La Plateforme ne collecte ni ne conserve aucune donnée
        bancaire. La livraison est immédiate : les fichiers sont débloqués dès confirmation du paiement.
        Un paiement resté sans confirmation est automatiquement abandonné après vingt-quatre heures et ne
        donne lieu à aucun débit.
      </p>

      <h2>7. Rétractation et remboursement</h2>
      <p>
        Le Client demande expressément la livraison immédiate des fichiers et reconnaît, en validant son
        paiement, perdre de ce fait son droit de rétractation, conformément à l’article L221-28 13° du Code
        de la consommation. Les cas de remboursement, notamment le paiement débité sans déblocage des
        fichiers, sont détaillés sur la{" "}
        <a href="/remboursement" className="link-underline text-ink">page dédiée</a>, qui fait partie
        intégrante des présentes conditions.
      </p>

      <h2>8. Durée de disponibilité des galeries</h2>
      <p>
        Chaque galerie reste accessible pendant la durée fixée par le Photographe, décomptée à partir de la
        première ouverture du lien par le Client, et prolongeable. La date d’expiration est affichée en
        permanence dans la galerie et rappelée par email avant l’échéance.
      </p>
      <p>
        À l’expiration, la galerie et l’ensemble des fichiers associés sont supprimés définitivement et sans
        possibilité de restauration. Il appartient au Client de télécharger ses fichiers avant cette date et
        au Photographe de conserver ses originaux par ses propres moyens : la Plateforme est un service de
        livraison, pas une solution d’archivage.
      </p>

      <h2>9. Propriété intellectuelle</h2>
      <p>
        Les photographies restent la propriété du Photographe. L’achat d’une photographie confère au Client
        un droit d’usage privé, sauf accord différent conclu directement avec son Photographe. La
        reproduction, la diffusion ou la mise en ligne des aperçus filigranés sont interdites. La marque, le
        logo et l’interface de la Plateforme sont protégés.
      </p>

      <h2>10. Disponibilité et responsabilité</h2>
      <p>
        La Plateforme s’engage à mettre en œuvre des moyens raisonnables pour assurer la disponibilité et la
        sécurité du service, sans garantie d’absence totale d’interruption. Elle n’est pas responsable des
        contenus publiés par les Photographes ni des litiges entre Photographes et Clients. Sa
        responsabilité, lorsqu’elle est engagée, est limitée aux sommes effectivement perçues au titre de la
        transaction concernée. Aucune stipulation ne limite les droits que la loi reconnaît aux
        consommateurs.
      </p>

      <h2>11. Données personnelles</h2>
      <p>
        Voir la <a href="/confidentialite" className="link-underline text-ink">politique de confidentialité</a>{" "}
        et la <a href="/cookies" className="link-underline text-ink">page cookies</a>.
      </p>

      <h2>12. Modification des conditions</h2>
      <p>
        Toute modification substantielle est notifiée aux Photographes par email au moins trente jours avant
        son entrée en vigueur. Les conditions applicables à un achat sont celles en vigueur au jour de cet
        achat.
      </p>

      <h2>13. Droit applicable et litiges</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable
        sera recherchée en écrivant à{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a>.
        À défaut, le consommateur peut recourir gratuitement à un médiateur de la consommation ou saisir la
        plateforme européenne de règlement en ligne des litiges, et conserve le droit de saisir la
        juridiction de son lieu de résidence.
      </p>
    </LegalPage>
  );
}
