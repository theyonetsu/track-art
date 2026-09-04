import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Track.Art", description: "Galeries photo professionnelles" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className="bg-black text-white antialiased">{children}</body></html>;
}
