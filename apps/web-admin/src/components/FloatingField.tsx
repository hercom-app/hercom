import { EyeIcon, EyeOffIcon } from "./icons/EyeIcons";

type FloatingFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
};

const fieldClass =
  "peer w-full rounded-lg border border-slate-200 bg-white px-3.5 pb-2.5 pt-5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-transparent focus:border-hercom focus:ring-2 focus:ring-hercom/20 md:text-sm";

const labelClass =
  "pointer-events-none absolute left-3.5 top-1/2 origin-left -translate-y-1/2 text-sm text-slate-400 transition-all peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:font-medium peer-focus:text-hercom peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-slate-600";

export function FloatingField({
  id,
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
}: FloatingFieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
        className={fieldClass}
      />
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
    </div>
  );
}

type FloatingPasswordFieldProps = {
  showPassword: boolean;
  onToggle: () => void;
};

export function FloatingPasswordField({
  showPassword,
  onToggle,
}: FloatingPasswordFieldProps) {
  return (
    <div className="relative">
      <input
        id="admin-password"
        name="password"
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        placeholder=" "
        className={`${fieldClass} pr-11`}
      />
      <label htmlFor="admin-password" className={labelClass}>
        Contraseña
      </label>
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
