export default function NotFound() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4 px-8">
        <p className="text-xs tracking-[0.3em] uppercase text-gray-600">Galerie introuvable</p>
        <h1 className="text-3xl font-thin tracking-widest">404</h1>
        <p className="text-gray-500 text-sm">
          Ce lien ne correspond à aucune galerie existante.
        </p>
      </div>
    </main>
  );
}
