"use client";

/**
 * Bandeau d'avis : deux rangées qui défilent en sens inverse (motion design),
 * en pause au survol, figées si l'utilisateur préfère moins d'animations.
 * Avis illustratifs — à remplacer par de vrais retours de photographes.
 */
const reviews = [
  { name: "Camille R.", city: "Paris", text: "Mes mariés ont fait leur sélection le soir même. Je n'envoie plus un seul WeTransfer." },
  { name: "Julien M.", city: "Lyon", text: "Les photos supplémentaires se vendent toutes seules. +40 % sur le panier moyen." },
  { name: "Sofia B.", city: "Bordeaux", text: "Enfin une galerie qui ressemble à mon travail. Les clients me le disent." },
  { name: "Thomas L.", city: "Nantes", text: "Le lien, le mot de passe, l'expiration : tout est réglé en deux minutes." },
  { name: "Inès K.", city: "Marseille", text: "Zéro relance. Le paiement arrive, les fichiers se débloquent, je ne fais plus rien." },
  { name: "Marc D.", city: "Lille", text: "Mes clients téléchargent depuis leur téléphone sans rien installer. Ça change tout." },
  { name: "Léa V.", city: "Toulouse", text: "Le filigrane à mon nom et la basse définition, je dors tranquille." },
  { name: "Antoine P.", city: "Strasbourg", text: "Interface sobre, rapide, sans pub. Exactement ce que je cherchais." },
  { name: "Nadia S.", city: "Nice", text: "La prolongation payante m'a rapporté plus que je pensais. Les clients l'utilisent." },
  { name: "Hugo F.", city: "Rennes", text: "Installé un dimanche soir, première galerie envoyée le lundi matin." },
];

function Stars() {
  return (
    <span className="flex gap-0.5" aria-label="5 étoiles sur 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 20 20" fill="var(--color-terracotta)" aria-hidden="true">
          <path d="M10 1.6l2.5 5.2 5.7.8-4.1 4 1 5.7L10 14.6 4.9 17.3l1-5.7-4.1-4 5.7-.8L10 1.6z" />
        </svg>
      ))}
    </span>
  );
}

function Card({ r }: { r: (typeof reviews)[number] }) {
  return (
    <figure className="card shrink-0 w-[268px] px-5 py-4 flex flex-col gap-2.5">
      <Stars />
      <blockquote className="text-[13px] leading-relaxed text-ink-soft">« {r.text} »</blockquote>
      <figcaption className="meta">{r.name} · {r.city}</figcaption>
    </figure>
  );
}

function Row({ items, reverse = false }: { items: typeof reviews; reverse?: boolean }) {
  return (
    <div className="marquee">
      <div className={`marquee-track ${reverse ? "marquee-reverse" : ""}`}>
        {[...items, ...items].map((r, i) => <Card key={`${r.name}-${i}`} r={r} />)}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const half = Math.ceil(reviews.length / 2);
  return (
    <section className="py-4 flex flex-col gap-4" aria-label="Avis de photographes">
      <Row items={reviews.slice(0, half)} />
      <Row items={reviews.slice(half)} reverse />
    </section>
  );
}
