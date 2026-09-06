"use client";

/** Filet de sécurité si l'erreur touche la mise en page racine. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ background: "#EFE6DA", color: "#221B18", fontFamily: "Georgia, serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p style={{ letterSpacing: "0.32em", textTransform: "uppercase", fontSize: 12 }}>Track.Art</p>
          <h1 style={{ fontSize: 34, margin: "16px 0" }}>Le site est momentanément indisponible.</h1>
          <button onClick={reset} style={{ padding: "12px 22px", background: "#221B18", color: "#EFE6DA", border: 0, cursor: "pointer", marginRight: 12 }}>Réessayer</button>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#221B18" }}>Retour à l’accueil</a>
        </div>
      </body>
    </html>
  );
}
