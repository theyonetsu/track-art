import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import Reveal from "../components/Reveal";
import BackLink from "../components/BackLink";

export const metadata = { title: "Aide & FAQ — Track.Art" };

const sections: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Le forfait et les photos incluses",
    items: [
      { q: "Combien de photos mon client peut-il choisir ?", a: "Autant que vous le décidez. Le nombre de photos incluses est libre : vous fixez une valeur par défaut dans votre compte, puis vous l'ajustez galerie par galerie (5, 12, 30, 200… sans limite). Au-delà, chaque photo supplémentaire est facturée au prix que vous avez choisi." },
      { q: "Puis-je fixer un prix différent selon les photos ?", a: "Oui. Un prix par défaut s'applique à toute la galerie, et vous pouvez modifier le prix de chaque photo individuellement depuis la grille (survolez la photo, cliquez sur le prix)." },
      { q: "Mon client peut-il acheter toutes les photos d’un coup ?", a: "Oui. Fixez un prix « toutes les photos » (dans votre compte par défaut, ou galerie par galerie). Un bouton « Débloquer les N photos » apparaît alors dans sa galerie : un seul paiement, tout est déverrouillé en HD. Il dispose aussi d’un bouton « Tout sélectionner » pour passer par le forfait et les extras à l’unité." },
      { q: "Puis-je offrir une photo à un client ?", a: "Oui. Survolez la photo dans votre espace et cliquez sur « Offrir » : elle est déverrouillée sans passer par le forfait ni le paiement. Vous pouvez aussi la reverrouiller." },
      { q: "Que voit le client avant de payer ?", a: "Des aperçus en basse définition, filigranés au nom de votre studio, impossibles à télécharger (clic droit, glisser-déposer et appui long bloqués). Les fichiers HD n'apparaissent qu'après confirmation ou paiement." },
      { q: "Dans quel format mon client récupère-t-il ses photos ?", a: "Exactement le fichier que vous avez importé : même format (JPEG, PNG, HEIC, TIFF…), même résolution, aucune recompression, avec son nom d'origine. Pas d'archive à décompresser : chaque photo se télécharge directement, et s'ouvre telle quelle sur ordinateur comme sur téléphone." },
    ],
  },
  {
    title: "Accès, sécurité et durée",
    items: [
      { q: "Comment mon client accède-t-il à sa galerie ?", a: "Par un lien unique que vous copiez ou envoyez par email depuis Track.Art. Aucun compte à créer pour lui. Vous pouvez ajouter un mot de passe : il sera demandé à la première ouverture puis mémorisé sur son appareil pendant 14 jours." },
      { q: "Combien de temps la galerie reste-t-elle ouverte ?", a: "La durée est réglable (30 jours par défaut) et démarre à la première ouverture du lien, pas à sa création. Un rappel est envoyé au client 3 jours avant l'échéance. À l'expiration, la galerie et tous ses fichiers (originaux, aperçus, filigranés) sont supprimés automatiquement." },
      { q: "Mon client a besoin de plus de temps ?", a: "Deux options : vous lui offrez des jours depuis la galerie (gratuit), ou il achète lui-même une prolongation au prix et à la durée que vous avez définis. Le bouton apparaît dans sa galerie pendant les 10 derniers jours." },
      { q: "Puis-je empêcher le téléchargement HD ?", a: "Oui. Désactivez « Téléchargement HD après déblocage » : le client voit ses photos confirmées sans filigrane mais ne peut pas télécharger les originaux, si vous préférez les livrer vous-même (tirages, clé USB, album)." },
      { q: "Où sont stockées les photos ?", a: "Sur un espace de stockage privé, jamais accessible publiquement. Chaque affichage passe par une adresse temporaire signée qui expire au bout d'une heure. Les originaux ne transitent que vers le client qui a payé." },
    ],
  },
  {
    title: "Paiements et commission",
    items: [
      { q: "Combien coûte Track.Art ?", a: "Aucun abonnement, aucun frais fixe. Track.Art prélève une commission uniquement sur ce que vos clients achètent en plus de leur forfait (photos supplémentaires, prolongations). Le pourcentage en vigueur est affiché dans votre espace, sur chaque galerie et sur chaque vente." },
      { q: "Comment mes clients paient-ils ?", a: "Par carte bancaire (Visa, Mastercard, Apple Pay, Google Pay) via Stripe, ou par PayPal. Aucun compte à créer pour le client, et le déblocage des photos est immédiat après confirmation du paiement." },
      { q: "Où suivre mes ventes ?", a: "Dans l'onglet Ventes : montant payé par le client, commission, net pour vous, galerie concernée, date et statut." },
    ],
  },
  {
    title: "Votre marque",
    items: [
      { q: "Que voient mes clients de ma marque ?", a: "Le nom de votre studio sous le titre de chaque galerie et dans les emails, votre message personnel en haut de la galerie, et votre filigrane (texte au choix) sur tous les aperçus." },
      { q: "Quels formats de photos puis-je envoyer ?", a: "JPEG, PNG, WEBP, HEIC et TIFF jusqu'à 80 Mo par fichier. Le nombre de photos par galerie n'est pas limité : déposez-en 40 ou 800 d'un coup, l'envoi est découpé automatiquement et la grille se remplit au fur et à mesure. Miniatures et versions filigranées sont générées à l'arrivée, l'orientation est corrigée." },
      { q: "Mes clients ne parlent pas français ?", a: "Chaque galerie a sa langue : français, anglais ou espagnol. Textes, boutons, dates et interface PayPal s’adaptent. Le client peut aussi tout télécharger d’un coup : les fichiers arrivent un par un, dans leur format et leur qualité d’origine." },
      { q: "Puis-je choisir la photo de couverture ?", a: "Oui. Par défaut c'est la première photo importée ; survolez n'importe quelle photo et cliquez sur l'icône de couverture pour la changer." },
    ],
  },
];

export default function AidePage() {
  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col grain">
      <SiteHeader />
      <main className="px-6 md:px-20 py-16 md:py-24 flex flex-col gap-16 max-w-5xl">
        <div className="flex flex-col gap-4 fade-up">
          <BackLink className="mb-2" />
          <p className="eyebrow">Aide &amp; FAQ</p>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight">Tout ce qu’il faut savoir avant votre première galerie.</h1>
          <p className="text-lg text-ink-soft max-w-2xl">Une question qui n’est pas ici ? <Link href="/contact" className="link-underline text-ink hover:text-terracotta">Écrivez-nous</Link>, nous répondons sous 48 h ouvrées.</p>
        </div>
        {sections.map((s) => (
          <Reveal key={s.title} as="section" className="flex flex-col gap-6">
            <h2 className="font-serif text-3xl border-b border-line pb-3">{s.title}</h2>
            <div className="flex flex-col gap-3">
              {s.items.map((it) => (
                <details key={it.q} className="card group">
                  <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-6">
                    <span className="subsection text-base">{it.q}</span>
                    <span className="label text-muted group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="px-6 pb-6 text-ink-soft leading-relaxed">{it.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        ))}
        <div className="card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div><p className="eyebrow mb-2">Prêt ?</p><p className="font-serif text-3xl">Créez votre compte en une minute.</p></div>
          <Link href="/inscription" className="btn btn-accent">Créer mon compte</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
