export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-black/95 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="w-16 h-2 bg-white/10 rounded animate-pulse" />
          <div className="w-40 h-3 bg-white/10 rounded animate-pulse" />
          <div className="w-16 h-2 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      {/* Sub-header skeleton */}
      <div className="max-w-7xl mx-auto px-3 pt-6 pb-4 text-center">
        <div className="w-48 h-2 bg-white/10 rounded animate-pulse mx-auto" />
      </div>

      {/* Photo grid skeleton */}
      <div className="max-w-7xl mx-auto px-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-white/5 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
