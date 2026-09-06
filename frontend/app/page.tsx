import Link from "next/link";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import HeroStack from "./components/HeroStack";
import PhoneMock from "./components/PhoneMock";
import Reveal from "./components/Reveal";
import Testimonials from "./components/Testimonials";

const steps = [
  { n: "01", title: "Déposez", text: "Importez vos photos en un glisser-déposer. Miniatures et filigrane sont générés automatiquement ; vos originaux restent privés, hors de portée." },
  { n: "02", title: "Partagez", text: "Un lien unique, protégé par mot de passe si vous le souhaitez. Votre client choisit ses photos incluses depuis son téléphone, sans compte à créer." },
  { n: "03", title: "Encaissez", text: "Photos supplémentaires et prolongations se règlent en ligne. Les fichiers HD se débloquent instantanément et la galerie expire d'elle-même après 30 jours." },
];

const perks = [
  ["Previews protégées", "Filigrane, basse définition, téléchargement désactivé. La HD n'existe qu'après paiement."],
  ["Pensé pour le mobile", "Vos clients sélectionnent depuis leur téléphone, sans application ni compte."],
  ["Expiration automatique", "30 jours après la première ouverture, la galerie et ses fichiers disparaissent."],
  ["Paiement intégré", "Carte bancaire, Apple Pay, Google Pay ou PayPal. Déblocage instantané, aucune facture à faire."],
];

export default function Home() {
  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col grain">
      <SiteHeader />

      {/* Hero */}
      <section className="px-6 md:px-20 pt-12 md:pt-20 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 flex flex-col gap-7 fade-up">
          <p className="eyebrow">Galeries privées pour photographes</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.02] font-normal">
            Vos photos, livrées <em className="italic">avec élégance.</em><br />Vos ventes, encaissées sans effort.
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft max-w-md">
            Track.Art transforme chaque séance en galerie privée : votre client sélectionne ses photos incluses, ajoute les autres à l'unité et télécharge ses fichiers HD. Vous, vous n'avez plus qu'à photographier.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link href="/inscription" className="btn btn-accent">Créer ma galerie</Link>
            <a href="#exemples" className="tap label link-underline hover:text-terracotta">Voir la galerie côté client</a>
          </div>
          <p className="text-sm text-muted">Sans abonnement · Paiement par carte ou PayPal · Stockage privé</p>
        </div>
        <div className="lg:col-span-7 fade-up" style={{ animationDelay: "0.15s" }}>
          <HeroStack />
        </div>
      </section>

      {/* Avis */}
      <Reveal className="px-6 md:px-20 flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="eyebrow">Ils l'utilisent au quotidien</p>
          <p className="meta">Photographes mariage, famille, studio et corporate</p>
        </div>
      </Reveal>
      <Testimonials />

      {/* Bande d'ambiance */}
      <Reveal stagger as="section" className="mt-16 px-6 md:px-20 grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 items-end">
        {[
          ["/showcase/lumiere-fenetre.webp", "h-40 md:h-64"],
          ["/showcase/reception-bokeh.webp", "h-52 md:h-80"],
          ["/showcase/golden-hour.webp", "h-36 md:h-56"],
          ["/showcase/bouquet.webp", "h-56 md:h-96"],
          ["/showcase/voile.webp", "h-44 md:h-72"],
          ["/showcase/nuit.webp", "h-48 md:h-64"],
        ].map(([src, h]) => (
          <div key={src} className={`tile ${h}`} style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ))}
      </Reveal>

      {/* Étapes */}
      <section id="fonctionnement" className="px-6 md:px-20 pt-24 md:pt-32 pb-8 scroll-mt-24">
        <Reveal className="flex flex-col gap-3 max-w-2xl mb-14">
          <p className="eyebrow">Fonctionnement</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">Trois gestes. Le reste est automatique.</h2>
        </Reveal>
        <Reveal stagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="card card-hover p-8 flex flex-col gap-5">
              <span className="font-serif text-6xl text-terracotta leading-none" style={{ textShadow: "0 2px 0 rgba(255,255,255,0.6)" }}>{s.n}</span>
              <h3 className="font-serif text-3xl font-medium">{s.title}</h3>
              <p className="text-base leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Exemples : galerie côté client */}
      <section id="exemples" className="px-6 md:px-20 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center scroll-mt-24">
        <Reveal className="flex flex-col gap-6 order-2 lg:order-1">
          <p className="eyebrow">Côté client</p>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight">Une galerie qui donne envie d'acheter.</h2>
          <p className="text-lg leading-relaxed text-ink-soft max-w-md">
            Ouverture par un simple lien, sélection d'un geste, compteur toujours visible, paiement en deux écrans. Vos clients y passent une soirée, pas une semaine.
          </p>
          <ul className="flex flex-col gap-3 text-base text-ink-soft">
            {["Forfait inclus puis photos supplémentaires à l'unité", "Compteur d'expiration visible en permanence", "Téléchargement HD immédiat après confirmation", "Prolongation en un clic si le client manque de temps"].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1.5 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#EFE6DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5 4.8 9.2 10 3.5" /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/inscription" className="btn btn-primary self-start mt-2">Créer ma galerie</Link>
        </Reveal>
        <Reveal className="order-1 lg:order-2">
          <div className="float"><PhoneMock /></div>
        </Reveal>
      </section>

      {/* Atouts */}
      <Reveal stagger as="section" className="mx-6 md:mx-20 py-16 border-t border-line grid grid-cols-2 md:grid-cols-4 gap-8">
        {perks.map(([t, d]) => (
          <div key={t} className="flex flex-col gap-2">
            <h3 className="font-serif text-2xl">{t}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{d}</p>
          </div>
        ))}
      </Reveal>

      {/* Tarifs */}
      <section id="tarifs" className="px-6 md:px-20 py-24 scroll-mt-24">
        <Reveal className="card px-8 md:px-14 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <p className="eyebrow">Tarifs</p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">Aucun frais fixe.<br />Une commission, uniquement sur vos ventes.</h2>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-lg leading-relaxed text-ink-soft">
              Créez autant de galeries que vous voulez, avec vos propres règles : nombre de photos incluses, prix, durée. Track.Art prélève une commission uniquement sur ce que vos clients achètent en plus — photos supplémentaires et prolongations. Pas de vente, pas de frais.
            </p>
            <div className="flex flex-wrap gap-5 items-center">
              <Link href="/inscription" className="btn btn-accent">Créer mon compte</Link>
              <Link href="/contact" className="tap label link-underline hover:text-terracotta">Une question ? Écrivez-nous</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
