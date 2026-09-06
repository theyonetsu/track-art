"use client";
import Link from "next/link";
import { useEffect } from "react";
import Logo from "./components/Logo";

/** Écran d'erreur : toujours une sortie vers l'accueil, jamais un cul-de-sac. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="min-h-screen bg-sand text-ink flex items-center justify-center px-6 grain">
      <div className="text-center flex flex-col items-center gap-5 max-w-md">
        <Logo size="sm" />
        <p className="label text-terracotta">Une erreur est survenue</p>
        <h1 className="font-serif text-4xl md:text-5xl">Quelque chose s’est mal passé.</h1>
        <p className="text-ink-soft">Réessayez dans un instant. Si le problème persiste, écrivez-nous depuis la page contact.</p>
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <button onClick={reset} className="btn btn-primary">Réessayer</button>
          <Link href="/" className="btn btn-outline">Retour à l’accueil</Link>
        </div>
      </div>
    </main>
  );
}
