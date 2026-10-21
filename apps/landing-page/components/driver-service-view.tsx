import NextLink from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { title } from "@/components/primitives";
import { DriverService } from "@/lib/driverServices";

export function DriverServiceView({ service }: { service: DriverService }) {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/servicios_background.png)] bg-cover bg-[90%_50%] md:bg-[50%_12%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section h-full grid place-items-center relative z-[3]">
          <hgroup className="space-y-4 flex flex-col items-center">
            <p className="text-primary font-semibold text-lg">
              {service.audience}
            </p>
            <h1
              className={title({
                class: "text-center font-bold text-balance",
                size: "lg",
              })}
            >
              {service.title}
            </h1>
          </hgroup>
        </div>
      </main>
      <section className="section py-10 lg:py-20">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <p className="text-balance text-lg text-center">{service.lead}</p>
          <ul className="space-y-4">
            {service.points.map((point) => (
              <li
                key={point}
                className="rounded-2xl bg-neutral-100 px-5 py-4 text-balance dark:bg-neutral-800"
              >
                {point}
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <NextLink
              className={buttonStyles({ color: "primary", radius: "full" })}
              href="/contactanos"
            >
              Hablar con un ejecutivo
            </NextLink>
            <NextLink
              className={buttonStyles({
                variant: "bordered",
                radius: "full",
              })}
              href="/servicios"
            >
              Ver todos los servicios
            </NextLink>
          </div>
        </div>
      </section>
    </>
  );
}
