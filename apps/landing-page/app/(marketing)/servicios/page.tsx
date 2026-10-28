import { Metadata } from "next";
import NextLink from "next/link";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { ReactNode } from "react";

import { PlayStoreButton } from "@/components/play-store-button";
import {
  BusinessIcon,
  PremiumIcon,
  ReplaceTaxi,
  SecurityIcon,
  VehicleTruckIcon,
} from "@/components/icons";
import { title } from "@/components/primitives";
import { driverServices, replacementDriver } from "@/lib/driverServices";

export const metadata: Metadata = {
  title: "Nuestros Servicios",
};

const serviceIcons: Record<string, () => ReactNode> = {
  "chofer-premium": () => <PremiumIcon className="text-primary" size={52} />,
  "chofer-corporativo": () => (
    <BusinessIcon className="text-primary" size={52} />
  ),
  "chofer-seguro": () => <SecurityIcon className="text-primary" size={52} />,
  "chofer-de-flota": () => (
    <VehicleTruckIcon className="text-primary" size={52} />
  ),
};

export default function Page() {
  return (
    <>
      <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-neutral-200 bg-[url(../assets/servicios_background.png)] bg-cover bg-[90%_50%] pt-16 -mt-16 dark:bg-neutral-900 md:bg-[50%_12%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section relative z-[3] flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center">
          <hgroup className="space-y-4 flex flex-col">
            <h1
              className={title({
                class: "text-center font-bold text-balance",
                size: "lg",
              })}
            >
              ¡Encuentra el servicio perfecto en la comodidad de tu propio
              vehículo!
            </h1>
          </hgroup>
        </div>
      </main>
      <section className="section py-10 lg:py-20 space-y-10">
        <h2
          className={title({
            size: "xs",
            fullWidth: true,
            class: "text-center",
          })}
        >
          Nuestros Servicios
        </h2>
        <p className="text-balance text-lg text-center">
          Actualmente contamos con líneas de negocios de Choferes para los
          diversos sectores de público que el mercado por hoy nos exige:
        </p>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="lg:col-span-2 flex justify-center">
            <Card className="w-full lg:w-[calc(50%-1.25rem)]">
              <CardHeader className="lg:hidden flex flex-col items-center">
                <ReplaceTaxi className="text-primary" size={52} />
                <h2 className="font-semibold text-center">
                  {replacementDriver.title}
                </h2>
              </CardHeader>
              <CardBody className="flex flex-row items-center gap-10 p-5">
                <div className="max-lg:hidden flex flex-col items-center p-5 bg-primary/25 rounded-lg min-w-36">
                  <ReplaceTaxi className="text-primary" size={52} />
                  <h2 className="font-semibold text-center">
                    {replacementDriver.title}
                  </h2>
                </div>
                <div className="flex flex-col items-start gap-3">
                  {replacementDriver.description.map((text) => (
                    <p key={text} className="text-sm text-balance">
                      {text}
                    </p>
                  ))}
                  <PlayStoreButton />
                  <p className="text-xs text-default-500">
                    Próximamente en Google Play
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
          {driverServices.map((service) => {
            const Icon = serviceIcons[service.slug];

            return (
              <NextLink
                key={service.slug}
                className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href={`/servicios/${service.slug}`}
              >
                <Card className="h-full transition-transform duration-300 hover:-translate-y-1">
                  <CardHeader className="lg:hidden flex flex-col items-center">
                    {Icon()}
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {service.audience}
                    </p>
                    <h2 className="font-semibold text-center">
                      {service.title}
                    </h2>
                  </CardHeader>
                  <CardBody className="flex flex-row items-center gap-10 p-5">
                    <div className="max-lg:hidden flex flex-col items-center p-5 bg-primary/25 rounded-lg min-w-36">
                      {Icon()}
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary text-center">
                        {service.audience}
                      </p>
                      <h2 className="font-semibold text-center">
                        {service.title}
                      </h2>
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      {service.description.map((text) => (
                        <p key={text} className="text-sm text-balance">
                          {text}
                        </p>
                      ))}
                      <p className="text-sm font-semibold text-primary">
                        Ver servicio
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </NextLink>
            );
          })}
        </div>
      </section>
    </>
  );
}
