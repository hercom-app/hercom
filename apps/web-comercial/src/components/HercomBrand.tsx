type HercomBrandProps = {
  subtitle?: string;
  logoWidth?: string;
};

/** Marca centrada Hercom (login y headers). Logo: /public/hercom-logo.png */
export function HercomBrand({
  subtitle = "Choferes para reemplazo",
  logoWidth = "w-52",
}: HercomBrandProps) {
  return (
    <div className="text-center">
      <img
        src="/hercom-logo.png"
        alt="Hercom"
        className={`mx-auto ${logoWidth}`}
      />
      <h1 className="mt-6 text-3xl font-bold tracking-widest text-white">
        HERCOM
      </h1>
      <p className="mt-2 text-base font-semibold uppercase tracking-wide text-white/90">
        {subtitle}
      </p>
    </div>
  );
}

/** Título compacto para header autenticado */
export function HercomHeaderTitle() {
  return (
    <div className="flex items-center gap-3">
      <img src="/hercom-logo.png" alt="" className="h-9 w-auto" aria-hidden />
      <span className="text-lg font-bold tracking-wide text-white">HERCOM</span>
    </div>
  );
}
