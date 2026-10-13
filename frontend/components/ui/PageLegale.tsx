import Link from "next/link";
import { miseAJourLegale } from "@/lib/legal";

export type SectionLegale = {
  id: string;
  titre: string;
  contenu: React.ReactNode;
};

// Mise en page commune aux pages légales : titre, sommaire cliquable et sections numérotées
export default function PageLegale({
  titre,
  introduction,
  sections,
  autrePage,
}: {
  titre: string;
  introduction: React.ReactNode;
  sections: SectionLegale[];
  autrePage: { href: string; label: string };
}) {
  return (
    <div className="bg-gray-50 pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-600">Informations légales</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#0F2A43]">{titre}</h1>
          <p className="mt-3 text-sm text-gray-500">Dernière mise à jour : {miseAJourLegale}</p>
          <div className="mt-6 text-gray-600 leading-relaxed">{introduction}</div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_1fr] lg:items-start">
          {/* Sommaire */}
          <nav aria-label="Sommaire" className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 lg:sticky lg:top-24">
            <p className="font-semibold text-gray-900">Sommaire</p>
            <ol className="mt-3 flex flex-col gap-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-gray-600 hover:text-blue-600">
                    {i + 1}. {s.titre}
                  </a>
                </li>
              ))}
            </ol>
            <Link href={autrePage.href} className="mt-5 block border-t border-gray-100 pt-4 text-sm font-medium text-blue-600 hover:underline">
              {autrePage.label} →
            </Link>
          </nav>

          {/* Contenu */}
          <article className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 sm:p-10 flex flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl font-semibold text-[#0F2A43]">
                  {i + 1}. {s.titre}
                </h2>
                <div className="mt-3 flex flex-col gap-3 text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_strong]:text-gray-900 [&_a]:text-blue-600 [&_a:hover]:underline">
                  {s.contenu}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
}
