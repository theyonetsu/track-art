import LegalPage from "../components/LegalPage";

export const metadata = { title: "Confidentialité — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Vos données" title="Politique de confidentialité">
      <h2>Ce que nous collectons</h2>
      <p>Pour les photographes : email, mot de passe chiffré, galeries et réglages. Pour leurs clients : l'adresse email ou le numéro de téléphone que le photographe renseigne pour envoyer le lien, la sélection de photos et les paiements effectués via PayPal. Nous ne voyons jamais vos données bancaires : elles sont traitées par PayPal.</p>
      <h2>Combien de temps</h2>
      <p>Une galerie et toutes ses photos (originaux, aperçus, versions filigranées) sont supprimées automatiquement 30 jours après la première ouverture du lien, sauf prolongation achetée. Les données de compte sont conservées tant que le compte existe.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l'accès, la rectification ou la suppression de vos données à contact@trak.art. Responsable du traitement : [RAISON SOCIALE], [ADRESSE].</p>
      <h2>Cookies</h2>
      <p>Track.Art n'utilise qu'un jeton de session technique pour maintenir la connexion des photographes. Aucun cookie publicitaire, aucun traceur tiers.</p>
    </LegalPage>
  );
}
