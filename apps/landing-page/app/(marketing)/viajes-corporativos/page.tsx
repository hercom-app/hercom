import { Metadata } from "next";

import { CorporateQuoteForm } from "@/components/corporate-quote-form";
import { PageHero } from "@/components/page-hero";
import ContactanosImg from "@/assets/contactanos_background.png";
import { driverServices, replacementDriver } from "@/lib/driverServices";

export const metadata: Metadata = {
  title: "Viajes corporativos",
  description:
    "No te preocupes si no puedes manejar, solicita un chofer con tu app HERCOM.",
};

export default function ViajesCorporativosPage() {
  return (
    <>
      <PageHero
        description="No te preocupes si no puedes manejar, solicita un chofer con tu app HERCOM."
        eyebrow="Viajes corporativos"
        image={ContactanosImg}
        imageAlt="Ejecutiva de atención de HERCOM"
        imageClassName="object-[50%_30%]"
        title="Soluciones de chofer para tu empresa"
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
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-default-600">
          Elige el servicio y cuéntanos el viaje. Un ejecutivo de HERCOM
          revisa la solicitud y te escribe con la cotización.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col justify-between rounded-3xl bg-primary p-8 text-white md:col-span-2 lg:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                App HERCOM
              </p>
              <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                {replacementDriver.title}
              </h3>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
                {replacementDriver.description[0]}
              </p>
            </div>
            <a
              className="mt-8 inline-flex w-fit rounded-full bg-white px-6 py-3 font-semibold text-primary transition-colors hover:bg-white/90"
              href="#cotizacion"
            >
              Contacta un ejecutivo
            </a>
          </article>

          {driverServices.map((service) => (
            <article
              key={service.slug}
              className="flex flex-col rounded-3xl border border-default-200 p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {service.audience}
              </p>
              <h3 className="mt-3 text-2xl font-bold">{service.title}</h3>
              <p className="mt-4 flex-1 leading-relaxed text-default-600">
                {service.lead}
              </p>
              <ul className="mt-6 space-y-2 text-sm leading-relaxed text-default-600">
                {service.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <a
                className="mt-6 font-semibold text-primary hover:underline"
                href="#cotizacion"
              >
                Contacta un ejecutivo
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section scroll-mt-28 pb-16 lg:pb-24" id="cotizacion">
        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          Cuéntanos el viaje
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-default-600">
          Deja los datos de tu empresa. Guardamos la solicitud y te enviamos
          la confirmación al correo que indiques.
        </p>
        <div className="mt-10">
          <CorporateQuoteForm />
        </div>
      </section>
    </>
  );
}
