import Link from "next/link";
import Logo from "./components/Logo";

const steps = [
  {
    n: "01",
    title: "Déposez",
    text: "Importez vos photos en un glisser-déposer. Miniatures et filigrane sont générés automatiquement ; vos originaux restent privés, hors de portée.",
  },
  {
    n: "02",
    title: "Partagez",
    text: "Un lien unique, envoyé par email. Votre client choisit ses photos incluses (15, 30 ou 60) depuis son téléphone, sans compte à créer.",
  },
  {
    n: "03",
    title: "Encaissez",
    text: "Photos supplémentaires et prolongations se règlent en ligne. Les fichiers HD se débloquent instantanément et la galerie expire d'elle-même après 30 jours.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-20 py-8">
        <Logo />
        <nav className="hidden md:flex gap-10 label text-ink">
          <a href="#fonctionnement" className="hover:text-terracotta transition-colors">Fonctionnement</a>
          <a href="#tarifs" className="hover:text-terracotta transition-colors">Tarifs</a>
          <a href="#exemples" className="hover:text-terracotta transition-colors">Exemples</a>
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/admin/login" className="label hover:text-terracotta transition-colors">Connexion</Link>
          <Link href="/admin/login" className="btn btn-primary hidden sm:inline-flex">Essayer gratuitement</Link>
        </div>
      </header>

      <section className="px-6 md:px-20 pt-8 md:pt-14 pb-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5 flex flex-col gap-7 fade-up">
          <p className="label text-terracotta tracking-[0.3em]">Galeries privées pour photographes</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.02] font-normal">
            Vos photos, livrées <em className="italic">avec élégance.</em><br />Vos ventes, encaissées sans effort.
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft max-w-md">
            Track.Art transforme chaque séance en galerie privée : votre client sélectionne ses photos incluses, ajoute les autres à l'unité et télécharge ses fichiers HD. Vous, vous n'avez plus qu'à photographier.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link href="/admin/login" className="btn btn-accent">Créer ma galerie</Link>
            <a href="#fonctionnement" className="label link-underline">Comment ça marche</a>
          </div>
          <p className="text-sm text-muted">Sans abonnement · Paiement sécurisé PayPal · Stockage privé</p>
        </div>
        <div className="lg:col-span-7 grid grid-cols-3 gap-3 md:gap-4 items-end">
          <div className="photo-placeholder h-48 md:h-80 mt-10 md:mt-20" />
          <div className="h-64 md:h-[520px]" style={{ background: "linear-gradient(160deg, #EAD4C2 0%, #C99B7F 50%, #9E6B52 100%)" }} />
          <div className="h-56 md:h-[420px] mb-6 md:mb-14" style={{ background: "linear-gradient(160deg, #F1E3D4 0%, #D8B79E 60%, #B88A6D 100%)" }} />
        </div>
      </section>

      <section className="mx-6 md:mx-20 mt-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-4 border-y border-line">
        <p className="font-serif italic text-xl md:text-2xl text-ink-soft">
          « Mes clients font leur sélection le soir même. Je n’envoie plus un seul WeTransfer, et les tirages supplémentaires se vendent tout seuls. »
        </p>
        <p className="label text-muted">[Nom du photographe] · [Ville]</p>
      </section>

      <section id="fonctionnement" className="px-6 md:px-20 py-20 md:py-28 grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col gap-4">
            <span className="font-serif text-5xl text-terracotta leading-none">{s.n}</span>
            <h3 className="font-serif text-3xl font-medium">{s.title}</h3>
            <p className="text-base leading-relaxed text-ink-soft">{s.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-6 md:mx-20 py-12 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          ["Previews protégées", "Filigrane, basse définition, téléchargement désactivé. La HD n'existe qu'après paiement."],
          ["Pensé pour le mobile", "Vos clients sélectionnent depuis leur téléphone, sans application ni compte."],
          ["Expiration automatique", "30 jours après la première ouverture, la galerie et ses fichiers disparaissent."],
          ["Paiement intégré", "PayPal, cartes bancaires, déblocage instantané. Aucune facture à faire."],
        ].map(([t, d]) => (
          <div key={t} className="flex flex-col gap-2">
            <h3 className="font-serif text-2xl">{t}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{d}</p>
          </div>
        ))}
      </section>

      <section id="tarifs" className="mx-6 md:mx-20 py-16 border-t border-line grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-4">
          <p className="label text-terracotta">Tarifs</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">Aucun frais fixe.<br />Une commission, uniquement sur vos ventes.</h2>
        </div>
        <p className="text-lg leading-relaxed text-ink-soft">
          Créez autant de galeries que vous voulez. Track.Art prélève [COMMISSION] % sur ce que vos clients achètent en plus de leur forfait — photos supplémentaires et prolongations. Pas de vente, pas de frais.
        </p>
      </section>

      <footer id="exemples" className="mt-auto flex flex-col sm:flex-row justify-between gap-3 px-6 md:px-20 py-8 border-t border-line label text-muted">
        <span>trak.art</span>
        <span>Mentions légales · Confidentialité · Contact</span>
      </footer>
    </div>
  );
}
