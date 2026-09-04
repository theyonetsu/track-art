/** Maquette statique de la galerie client, dans un cadre de téléphone. */
const tiles = [
  { h: 150, bg: "url(/showcase/reception-bokeh.webp) center/cover", sel: true },
  { h: 110, bg: "url(/showcase/lumiere-fenetre.webp) center/cover" },
  { h: 110, bg: "url(/showcase/golden-hour.webp) center/cover" },
  { h: 150, bg: "url(/showcase/bouquet.webp) center/cover", sel: true },
  { h: 130, bg: "url(/showcase/voile.webp) center/cover" },
  { h: 110, bg: "url(/showcase/nuit.webp) center/cover" },
];

export default function PhoneMock() {
  return (
    <div
      className="relative mx-auto w-[300px] h-[620px] rounded-[44px] bg-ink p-3"
      style={{ boxShadow: "0 4px 8px rgba(34,27,24,0.12), 0 50px 100px -30px rgba(34,27,24,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)" }}
      aria-hidden="true"
    >
      <div className="absolute left-1/2 -translate-x-1/2 top-3 w-24 h-6 rounded-b-2xl bg-ink z-10" />
      <div className="relative w-full h-full rounded-[34px] bg-sand overflow-hidden flex flex-col">
        <div className="pt-12 pb-3 px-5 flex flex-col items-center gap-1 text-center">
          <span className="font-serif text-[10px] tracking-[0.32em] uppercase">Track<span className="text-terracotta">.</span>Art</span>
          <span className="font-serif text-2xl leading-tight mt-1">Léa <em className="italic">&amp;</em> Thomas</span>
          <span className="label text-muted text-[10px]">Séance du 14 juin</span>
        </div>
        <div className="mx-4 py-2 border-y border-line flex justify-between items-center">
          <span className="text-[11px]"><strong className="font-medium">12</strong> <span className="text-muted">/ 30 incluses</span></span>
          <span className="label text-terracotta text-[9px]">23 jours restants</span>
        </div>
        <div className="flex-1 px-4 pt-3 grid grid-cols-2 gap-2 content-start overflow-hidden">
          {tiles.map((t, i) => (
            <div key={i} className="relative tile" style={{ height: t.h, background: t.bg, outline: t.sel ? "2px solid #9E4F37" : "none", outlineOffset: -2 }}>
              {t.sel && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-terracotta flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#EFE6DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5 4.8 9.2 10 3.5" /></svg>
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="glass border-t border-line px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col"><span className="text-xs font-medium">12 photos</span><span className="text-[10px] text-muted">Incluses dans votre forfait</span></div>
          <span className="btn btn-primary !min-h-0 !py-2.5 !px-4 !text-[10px]">Confirmer</span>
        </div>
      </div>
    </div>
  );
}
