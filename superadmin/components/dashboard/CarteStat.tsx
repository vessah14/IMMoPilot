// Carte de statistique du dashboard : titre + icône en haut, contenu libre en dessous
export default function CarteStat({
  titre,
  icon: Icone,
  couleur,
  children,
}: {
  titre: string;
  icon: React.ComponentType<{ className?: string }>;
  couleur: string; // ex : "bg-blue-100 text-blue-600"
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{titre}</p>
        <div className={`size-10 shrink-0 rounded-lg flex items-center justify-center ${couleur}`}>
          <Icone className="size-5" />
        </div>
      </div>
      {children}
    </div>
  );
}
