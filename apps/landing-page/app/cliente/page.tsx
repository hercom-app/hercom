import { Metadata } from "next";

import { title } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Cliente",
};

export default function Page() {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/cliente_background.png)] bg-cover bg-[45%_50%] md:bg-[50%_15%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section h-full grid place-items-center relative z-[3]">
          <h1
            className={title({
              class: "text-center font-bold text-balance",
              size: "lg",
            })}
          >
            Reglas de Servicio
          </h1>
        </div>
      </main>
      <section className="section py-10 lg:py-32 space-y-10">
        <h2
          className={title({
            size: "xs",
            fullWidth: true,
            class: "text-center",
          })}
        >
          Reglas para el Cliente
        </h2>
        <p className="text-balance text-lg text-center">
          Usted deberá confirmar que cuenta con toda la documentación legal de
          su vehiculo como la tarjeta de propiedad del mismo, el Seguro
          Obligatorio de Accidentes de Tránsito (SOAT) y el Certificado de
          Revisión Técnica
        </p>
      </section>
    </>
  );
}
