// Squelette affiché dans l'espace connecté pendant le chargement d'une page :
// la barre latérale et l'en-tête restent visibles, seul le contenu clignote
export default function ChargementEspace() {
  return (
    <div role="status" aria-live="polite" className="flex animate-pulse flex-col gap-8">
      <span className="sr-only">Chargement…</span>

      {/* Titre + boutons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="h-9 w-56 rounded-lg bg-gray-200" />
          <div className="h-4 w-80 max-w-full rounded bg-gray-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-lg bg-gray-100" />
          <div className="h-10 w-40 rounded-lg bg-blue-100" />
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-gray-100" />
              <div className="size-10 rounded-lg bg-gray-100" />
            </div>
            <div className="h-8 w-24 rounded bg-gray-200" />
            <div className="h-3 w-40 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex gap-3 border-b border-gray-100 p-5">
          <div className="h-10 flex-1 rounded-lg bg-gray-100" />
          <div className="h-10 w-36 rounded-lg bg-gray-100" />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 last:border-0">
            <div className="size-10 shrink-0 rounded-full bg-gray-100" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
            <div className="hidden h-6 w-20 rounded-full bg-gray-100 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
