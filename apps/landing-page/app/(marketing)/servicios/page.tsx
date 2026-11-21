import { Metadata } from "next";
import NextLink from "next/link";
import { ReactNode } from "react";

import { PageHero } from "@/components/page-hero";
import { PlayStoreButton } from "@/components/play-store-button";
import {
  BusinessIcon,
  PremiumIcon,
  ReplaceTaxi,
  SecurityIcon,
  VehicleTruckIcon,
} from "@/components/icons";
import { driverServices, replacementDriver } from "@/lib/driverServices";
import ServiciosImg from "@/assets/servicios_background.png";

export const metadata: Metadata = {
  title: "Nuestros Servicios",
};

const serviceIcons: Record<string, ReactNode> = {
  "chofer-premium": <PremiumIcon size={36} />,
  "chofer-corporativo": <BusinessIcon size={36} />,
  "chofer-seguro": <SecurityIcon size={36} />,
  "chofer-de-flota": <VehicleTruckIcon size={36} />,
};

export default function Page() {
  return (
    <>
      <PageHero
        description={
          <p>
            Actualmente contamos con líneas de negocios de Choferes para los
            diversos sectores de público que el mercado por hoy nos exige.
          </p>
        }
        eyebrow="Nuestros Servicios"
        image={ServiciosImg}
        imageAlt="Chofer HERCOM manejando el vehículo de un cliente"
        imageClassName="object-[60%_40%]"
        title="¡Encuentra el servicio perfecto en la comodidad de tu propio vehículo!"
      />

      <section className="section pb-16 lg:pb-24">
        <div className="grid items-center gap-8 rounded-[2rem] bg-primary p-8 text-white md:grid-cols-[auto_1fr] lg:p-12">
          <ReplaceTaxi size={72} />
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {replacementDriver.title}
            </h2>
            {replacementDriver.description.map((text) => (
              <p key={text} className="mt-3 max-w-2xl text-white/85">
                {text}
              </p>
            ))}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PlayStoreButton />
              <span className="text-sm text-white/75">
                Próximamente en Google Play
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {driverServices.map((service) => (
            <NextLink
              key={service.slug}
              className="group flex flex-col rounded-3xl bg-default-100 p-8 transition-colors hover:bg-default-200 dark:bg-default-50 dark:hover:bg-default-100"
              href={`/servicios/${service.slug}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {service.audience}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{service.title}</h2>
                </div>
                <span className="text-primary">
                  {serviceIcons[service.slug]}
                </span>
              </div>
              <div className="mt-5 space-y-2 text-default-600">
                {service.description.map((text) => (
                  <p key={text} className="leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
              <span className="mt-6 font-semibold text-primary group-hover:underline">
                Ver servicio →
              </span>
            </NextLink>
          ))}
        </div>
      </section>
    </>
  );
}
