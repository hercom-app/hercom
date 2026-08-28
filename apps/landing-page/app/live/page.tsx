import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Viaje en vivo",
  robots: { index: false, follow: false },
};

export default function LiveIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Hercom
      </p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">
        Seguimiento de viaje
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Abre el enlace que te compartieron. Tiene esta forma:
      </p>
      <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
        hercom-landing.vercel.app/live/código
      </p>
    </main>
  );
}
