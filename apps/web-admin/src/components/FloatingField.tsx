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
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-base leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-hercom focus:ring-2 focus:ring-hercom/20 md:text-sm";

const labelClass =
  "mb-1.5 block text-xs font-medium text-slate-500";

export function FloatingField({
  id,
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
}: FloatingFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={fieldClass}
      />
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
    <div>
      <label htmlFor="admin-password" className={labelClass}>
        Contraseña
      </label>
      <div className="relative">
        <input
          id="admin-password"
          name="password"
          type={showPassword ? "text" : "password"}
          required
          autoComplete="current-password"
          className={`${fieldClass} pr-12`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
