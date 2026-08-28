import { Metadata } from "next";

import { title } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Nosotros",
};

export default function Page() {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/nosotros_background.png)] bg-cover bg-[46%_50%] md:bg-[50%_25%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section h-full grid place-items-center relative z-[3]">
          <hgroup className="space-y-4 flex flex-col">
            <h1
              className={title({
                class: "text-center font-bold text-balance",
                size: "lg",
              })}
            >
              Cuidamos de ti y de tu familia
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
          Nosotros
        </h2>
        <p className="text-balance text-lg lg:text-center">
          Somos una empresa peruana, con experiencia en diagnóstico de brechas
          sociales, elaboración de procesos, desarrollo de software e
          implementación de alta tecnología en el mercado nacional e
          internacional.
        </p>
        <p className="text-balance text-lg lg:text-center">
          Contamos con un equipo de profesionales que nos permite garantizar
          aportes a una sociedad moderna con soluciones móviles e inteligentes y
          complementándolos con otros servicios como es hoy en día la
          inseguridad por la que atravesamos.
        </p>
      </section>
      <div className="w-full bg-foreground/10 py-10 lg:py-20">
        <section className="section space-y-10">
          <h2
            className={title({
              size: "xs",
              fullWidth: true,
              class: "text-center",
            })}
          >
            Sobre la App
          </h2>
          <div className="space-y-5">
            <p className="text-balance text-lg lg:text-center">
              APP HERCOM - CHOFERES PARA REMPLAZO es un aplicativo móvil que fue
              estudiado y desarrollado para mitigar una brecha social como son
              los ACCIDENTES DE TRANSITO, causados por diferentes maniobras al
              volante como fue desde el año 1896 en New York - EE. UU, donde se
              realizaban las primeras pruebas de vehículos a motor y remontando
              a la actualidad, donde los accidentes de tránsito son ocasionados
              en su mayoría por la ingesta de alcohol, en otros casos por
              descuido o por una distracción al volante o como también por el
              stres que actualmente vivimos.
            </p>
            <p className="text-balance text-lg lg:text-center">
              La APP HERCOM - CHOFER PARA REMPLAZO, es el inicio de querer
              profesionalizar a la persona que va al volante y te ofrece su
              servicio en las distintas opciones que te presentamos.
              Impulsaremos acciones preventivas de seguridad física, seguridad
              médica y seguridad social. La APP está diseñada para sugerir
              acciones móviles que nos permita llegar sanos y salvos a casa.
            </p>
          </div>
        </section>
      </div>
      <section className="section py-10 lg:py-20 space-y-10">
        <p className="text-balance text-lg lg:text-center">
          Sobre CHOFER PARA REMPLAZO, la RAE (Real Academia Española) acepta
          ambos términos a utilizar en una oración como reemplazo y remplazo;
          hemos querido trabajar con una sola &apos;E&apos; en el término
          remplazo, porque nosotros somos consientes que vamos a conducir un
          vehículo que necesita de nosotros, de nuestro profesionalismo y no
          consideramos estar definidos como una segunda opción de reemplazar a
          alguien.
        </p>
        <p className="text-balance text-lg lg:text-center">
          Nuestros servicios pueden ser programados en la APP o en la Central
          Telefónica con anticipación y de esta manera prevenir cualquier tipo
          de accidente de tránsito. Trabajamos las 24 horas del día con la
          finalidad de contar siempre con nuestros choferes y no solo depender
          de una póliza. Por la que muchos por sentirse obligados a pagar mes a
          mes optan por manejar sin la lucidez necesaria y luego ocasionando
          desastres familiares como también desastres sociales (accidentes,
          multas, o hasta la muerte). Podrás contar con nuestros servicios desde
          ya, desde tu móvil, desde tu casa.
        </p>
      </section>
    </>
  );
}
