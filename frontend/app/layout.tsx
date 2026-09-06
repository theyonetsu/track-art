import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost, DM_Mono } from "next/font/google";
import "./globals.css";
import ScrollFx from "./components/ScrollFx";
import NavProgress from "./components/NavProgress";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EFE6DA",
};

export const metadata: Metadata = {
  title: "Track.Art — Galeries photo pour photographes",
  description: "Envoyez un lien privé, vos clients choisissent leurs photos, achètent les extras et téléchargent en HD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${jost.variable} ${mono.variable}`}>
      <body className="bg-sand text-ink antialiased"><ScrollFx /><NavProgress />{children}</body>
    </html>
  );
}
