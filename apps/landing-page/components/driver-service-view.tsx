import NextLink from "next/link";

import { PageHero } from "@/components/page-hero";
import { DriverService } from "@/lib/driverServices";
import ServiciosImg from "@/assets/servicios_background.png";

export function DriverServiceView({ service }: { service: DriverService }) {
  return (
    <>
      <PageHero
        description={<p>{service.lead}</p>}
        eyebrow={service.audience}
        image={ServiciosImg}
        imageAlt="Chofer HERCOM manejando el vehículo de un cliente"
        imageClassName="object-[60%_40%]"
        title={service.title}
      >
        <div className="flex flex-wrap gap-3">
          <NextLink
            className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-600"
            href="/viajes-corporativos"
          >
            Hablar con un ejecutivo
          </NextLink>
          <NextLink
            className="rounded-full border border-default-300 px-6 py-3 font-semibold transition-colors hover:bg-default-100"
            href="/servicios"
          >
            Ver todos los servicios
          </NextLink>
        </div>
      </PageHero>
      <section className="section pb-16 lg:pb-24">
        <ul className="grid gap-4 md:grid-cols-2">
          {service.points.map((point, index) => (
            <li
              key={point}
              className="rounded-3xl bg-default-100 p-7 dark:bg-default-50"
            >
              <span className="text-sm font-bold text-primary">
                0{index + 1}
              </span>
              <p className="mt-3 text-lg leading-relaxed">{point}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
