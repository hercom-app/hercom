import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import {
  AdminCard,
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminTableWrap,
} from "../components/AdminLayout";

function formatWhen(timestamp: number): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

export function QuotesView() {
  const rows = useQuery(api.corporateQuotes.listForAdmin, {});

  return (
    <AdminPage>
      <AdminCard>
        {rows === undefined ? (
          <AdminLoading message="Cargando cotizaciones…" />
        ) : rows.length === 0 ? (
          <AdminEmpty message="Todavía no hay solicitudes de viajes corporativos." />
        ) : (
          <AdminTableWrap>
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Ciudad</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                  <th className="px-4 py-3 font-medium">Confirmación</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id} className="border-t border-zinc-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {formatWhen(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {row.companyName}
                    </td>
                    <td className="px-4 py-3">{row.contactName}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">{row.city}</td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600">
                      {row.detail}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.emailSent ? "Enviado" : "Pendiente"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableWrap>
        )}
      </AdminCard>
    </AdminPage>
  );
}
