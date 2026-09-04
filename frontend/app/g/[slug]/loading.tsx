export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-7xl mx-auto px-5 pt-14 pb-4 flex flex-col items-center gap-3">
        <div className="w-16 h-2 bg-line rounded animate-pulse" />
        <div className="w-48 h-5 bg-line rounded animate-pulse" />
        <div className="w-24 h-2 bg-line rounded animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto px-5 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-sand-deep animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
        ))}
      </div>
    </div>
  );
}
