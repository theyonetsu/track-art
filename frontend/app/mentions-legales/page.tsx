import LegalPage from "../components/LegalPage";

export const metadata = { title: "Mentions légales — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Informations" title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>Track.Art est édité par [RAISON SOCIALE OU NOM], [FORME JURIDIQUE], au capital de [CAPITAL], immatriculée sous le numéro [SIREN], dont le siège est situé [ADRESSE]. Directeur de la publication : [NOM]. Contact : [EMAIL].</p>
      <h2>Hébergement</h2>
      <p>Le site est hébergé par [HÉBERGEUR], [ADRESSE DE L'HÉBERGEUR]. Les fichiers photo sont stockés sur un espace privé chez [PRESTATAIRE DE STOCKAGE] et ne sont jamais accessibles publiquement.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les photographies présentes dans les galeries restent la propriété exclusive des photographes qui les publient. Toute reproduction ou diffusion sans leur accord est interdite. La marque, le logo et l'interface Track.Art sont protégés.</p>
    </LegalPage>
  );
}
