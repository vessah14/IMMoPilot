import Logo from "@/components/ui/Logo";

// Affiché pendant le chargement d'une page (avant que ses données n'arrivent)
export default function Chargement() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white">
      <div className="animate-pulse">
        <Logo className="h-12" />
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full w-1/3 animate-[glisser_1.1s_ease-in-out_infinite] rounded-full bg-blue-600" />
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
