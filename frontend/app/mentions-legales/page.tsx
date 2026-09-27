import LegalPage from "../components/LegalPage";
import { ENTREPRISE, IDENTITE_COMPLETE, SITE, SOUS_TRAITANTS } from "../lib/legal";

export const metadata = { title: "Mentions légales — Track.Art" };

export default function Page() {
  const hebergeur = SOUS_TRAITANTS[0];
  const stockage = SOUS_TRAITANTS[1];
  return (
    <LegalPage eyebrow="Informations" title="Mentions légales">
      {!IDENTITE_COMPLETE && (
        <p className="help">
          Les informations d&apos;immatriculation de l&apos;éditeur sont en cours de finalisation et seront
          publiées ici avant toute ouverture commerciale du service.
        </p>
      )}

      <h2>Éditeur du site</h2>
      <p>
        {SITE.nom} ({SITE.domaine}) est édité par {ENTREPRISE.nom}, {ENTREPRISE.formeJuridique},
        immatriculé sous le numéro SIRET {ENTREPRISE.siret}, dont l&apos;établissement est situé{" "}
        {ENTREPRISE.adresse}. {ENTREPRISE.tva}.
      </p>
      <p>
        Directeur de la publication : {ENTREPRISE.directeurPublication}. Contact :{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a>.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site et sa base de données sont hébergés par {hebergeur.nom} ({hebergeur.pays}). Les fichiers
        photo sont stockés séparément chez {stockage.nom}, sur un espace privé situé dans{" "}
        {stockage.pays.toLowerCase()} : aucun fichier n&apos;est accessible publiquement, chaque accès passe
        par un lien signé à durée limitée.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les photographies présentes dans les galeries restent la propriété exclusive des photographes qui
        les publient. Toute reproduction ou diffusion sans leur accord est interdite. La marque, le logo et
        l&apos;interface {SITE.nom} sont protégés.
      </p>

      <h2>Signaler un contenu</h2>
      <p>
        Tout contenu manifestement illicite hébergé sur {SITE.domaine} peut être signalé à{" "}
        <a href={`mailto:${ENTREPRISE.email}`} className="link-underline text-ink">{ENTREPRISE.email}</a>.
        Le signalement doit décrire le contenu, indiquer l&apos;adresse de la page concernée et le motif du
        signalement. Nous accusons réception et traitons ces demandes sans délai injustifié.
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        En cas de litige non résolu directement, tout consommateur peut recourir gratuitement à un médiateur
        de la consommation. La plateforme européenne de règlement en ligne des litiges est accessible à
        l&apos;adresse <a href="https://ec.europa.eu/consumers/odr" className="link-underline text-ink" rel="noreferrer noopener" target="_blank">ec.europa.eu/consumers/odr</a>.
      </p>
    </LegalPage>
  );
}
