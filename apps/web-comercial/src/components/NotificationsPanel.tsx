import { useMutation, useQuery } from "convex/react";
import { api } from "@proyecto/backend";

export function NotificationsPanel() {
  const notifications = useQuery(api.notifications.listMine, { limit: 8 });
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (notifications === undefined) {
    return <p className="text-sm text-slate-500">Cargando notificaciones...</p>;
  }

  const unread = notifications.filter((notification) => notification.readAt === undefined)
    .length;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">
          Notificaciones ({unread} sin leer)
        </h2>
        <button
          type="button"
          onClick={() => void markAllAsRead()}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Marcar todo leído
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-xs text-slate-500">Aún no tienes notificaciones.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <p className="text-xs font-semibold text-slate-800">{notification.title}</p>
              <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
