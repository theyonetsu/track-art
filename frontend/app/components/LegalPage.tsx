import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import BackLink from "./BackLink";

export default function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col">
      <SiteHeader />
      <main className="px-6 md:px-20 py-16 md:py-24 max-w-3xl fade-up">
        <BackLink className="mb-6" />
        <p className="label text-terracotta mb-4">{eyebrow}</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-tight mb-10">{title}</h1>
        <div className="flex flex-col gap-6 text-base leading-relaxed text-ink-soft [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-ink [&_h2]:mt-4">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
