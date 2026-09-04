import Link from "next/link";
import Logo from "./components/Logo";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6">
      <div className="text-center flex flex-col items-center gap-5 max-w-md">
        <Logo size="sm" />
        <p className="label text-terracotta">Galerie introuvable</p>
        <h1 className="font-serif text-5xl">Ce lien ne mène nulle part.</h1>
        <p className="text-ink-soft">Vérifiez l’adresse reçue ou demandez un nouveau lien à votre photographe.</p>
        <Link href="/" className="label link-underline mt-2">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
