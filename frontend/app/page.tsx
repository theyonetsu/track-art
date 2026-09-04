export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-thin tracking-[0.3em] uppercase">Track<span className="text-gray-400">.</span>Art</h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase">Galeries photo professionnelles</p>
        <div className="flex gap-4 justify-center pt-8">
          <a href="/admin/login" className="px-8 py-3 border border-white text-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300">Admin</a>
        </div>
      </div>
    </main>
  );
}
