import LegalPage from "../components/LegalPage";

export const metadata = { title: "Contact — Track.Art" };

export default function Page() {
  return (
    <LegalPage eyebrow="Contact" title="Parlons de vos galeries.">
      <p>Track.Art ouvre progressivement aux photographes. Pour demander un accès, poser une question ou signaler un problème, écrivez-nous : nous répondons sous 48 h ouvrées.</p>
      <div className="flex flex-wrap gap-5 items-center pt-2">
        <a href="mailto:[EMAIL]?subject=Track.Art" className="btn btn-accent">Écrire à [EMAIL]</a>
        <a href="/admin/login" className="label link-underline hover:text-terracotta">Déjà photographe ? Se connecter</a>
      </div>
    </LegalPage>
  );
}
