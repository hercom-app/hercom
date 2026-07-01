export type AdminSection =
  | "accounts"
  | "topups"
  | "services"
  | "promotions"
  | "premium";

const NAV_ITEMS: Array<{ id: AdminSection; label: string }> = [
  { id: "accounts", label: "Cuentas" },
  { id: "topups", label: "Recargas" },
  { id: "services", label: "Servicios" },
  { id: "promotions", label: "Promociones" },
  { id: "premium", label: "Viajes premium" },
];

type AdminNavProps = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
};

export function AdminNav({ active, onChange }: AdminNavProps) {
  return (
    <nav className="flex flex-wrap gap-1 border-t border-white/20 px-6 py-2">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            active === item.id
              ? "bg-white text-hercom"
              : "text-white/85 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
