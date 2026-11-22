import { Metadata } from "next";
import { ReactNode } from "react";

import { CorporateQuoteForm } from "@/components/corporate-quote-form";
import { PageHero } from "@/components/page-hero";
import ContactanosImg from "@/assets/contactanos_background.png";
import { driverServices } from "@/lib/driverServices";

function SolutionIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      className="h-8 w-8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.6}
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

const SOLUTION_ICONS: Record<string, ReactNode> = {
  "chofer-premium": (
    <SolutionIcon>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 19c.7-2.8 2.8-4.5 6-4.5s5.3 1.7 6 4.5" />
    </SolutionIcon>
  ),
  "chofer-corporativo": (
    <SolutionIcon>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M3 12h18" />
    </SolutionIcon>
  ),
  "chofer-seguro": (
    <SolutionIcon>
      <path d="M12 3l7 3v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </SolutionIcon>
  ),
  "chofer-de-flota": (
    <SolutionIcon>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4l3 3v2h-7" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </SolutionIcon>
  ),
};

const HERO_DESCRIPTION =
  "Gestiona tus traslados personales y los de tu equipo de forma simple y segura con Hercom. Simplificamos la movilidad de tu empresa con choferes eficientes, confiables y adaptados a cada necesidad.";

export const metadata: Metadata = {
  title: "Viajes corporativos",
  description: HERO_DESCRIPTION,
};

export default function ViajesCorporativosPage() {
  return (
    <>
      <PageHero
        description={HERO_DESCRIPTION}
        eyebrow="Viajes corporativos"
        image={ContactanosImg}
        imageAlt="Ejecutiva de atención de HERCOM"
        imageClassName="object-[50%_30%]"
        title="Reserva un chofer para ti o tu empresa"
      >
        <a
          className="rounded-full bg-primary px-7 py-3.5 font-semibold text-white transition-colors hover:bg-primary-600"
          href="#cotizacion"
        >
          Contacta un ejecutivo
        </a>
      </PageHero>

      <section className="section pb-8 lg:pb-12" id="soluciones">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Soluciones
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          Un chofer para cada necesidad
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {driverServices.map((service) => (
            <article
              key={service.slug}
              className="flex flex-col rounded-3xl border border-default-200 p-5 sm:p-8"
            >
              <span className="text-primary">{SOLUTION_ICONS[service.slug]}</span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">
                {service.audience}
              </p>
              <h3 className="mt-2 text-2xl font-bold">{service.title}</h3>
              <p className="mt-4 leading-relaxed text-default-600">
                {service.lead}
              </p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-default-600">
                {service.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section scroll-mt-28 pb-16 lg:pb-24" id="cotizacion">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cuéntanos de tu viaje
        </h2>
        <p className="mt-3 text-base leading-snug text-default-600 md:whitespace-nowrap md:text-lg">
          Compártenos los detalles de tu traslado aquí abajo para ayudarte.
        </p>
        <div className="mt-6">
          <CorporateQuoteForm />
        </div>
      </section>
    </>
  );
}
