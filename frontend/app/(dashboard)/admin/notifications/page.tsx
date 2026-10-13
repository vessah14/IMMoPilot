import ListeNotifications from "@/components/dashboard/ListeNotifications";
import { apiServeur, horodatageServeur } from "@/lib/api-serveur";
import type { Notification } from "@/lib/types";

export default async function Notifications() {
  const notifications = await apiServeur<Notification[]>("/notifications");
  const maintenant = horodatageServeur(); // heure de référence pour « il y a 5 min »
  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <section className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-500">Notifications</h1>
        <p className="mt-2 text-gray-500">
          {nonLues > 0
            ? `Vous avez ${nonLues} notification${nonLues > 1 ? "s" : ""} non lue${nonLues > 1 ? "s" : ""}.`
            : "Vous êtes à jour."}
        </p>
      </div>

      <ListeNotifications initiales={notifications} maintenant={maintenant} />
    </section>
  );
}
