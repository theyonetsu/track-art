import Link from "next/link";

/** Chemin de retour explicite, présent en haut de chaque page secondaire. */
export default function BackLink({ href = "/", label = "Accueil", className = "" }: { href?: string; label?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`tap label text-muted hover:text-terracotta transition-colors inline-flex items-center gap-2 w-fit ${className}`}
    >
      <span aria-hidden>←</span> {label}
    </Link>
  );
}
