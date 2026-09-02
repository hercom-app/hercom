export type AdminSection =
  | "accounts"
  | "drivers"
  | "markets"
  | "topups"
  | "services"
  | "support"
  | "promotions"
  | "clients";

const NAV_ITEMS: Array<{ id: AdminSection; label: string; shortLabel: string }> =
  [
    { id: "drivers", label: "Choferes", shortLabel: "Choferes" },
    { id: "markets", label: "Moneda y tipo de cambio", shortLabel: "Moneda" },
    { id: "services", label: "Servicios", shortLabel: "Servicios" },
    { id: "support", label: "Soporte", shortLabel: "Soporte" },
    { id: "topups", label: "Recargas", shortLabel: "Recargas" },
    { id: "promotions", label: "Promociones", shortLabel: "Promos" },
    { id: "accounts", label: "Cuentas de usuario", shortLabel: "Cuentas" },
    { id: "clients", label: "Clientes", shortLabel: "Clientes" },
  ];

type AdminNavProps = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
};

export function AdminNav({ active, onChange }: AdminNavProps) {
  return (
    <nav className="border-t border-slate-100 bg-slate-50/80">
      <div className="scrollbar-thin mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                isActive
                  ? "bg-white text-hercom shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
