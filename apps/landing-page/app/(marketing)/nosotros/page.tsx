import { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import NosotrosImg from "@/assets/nosotros_background.png";

export const metadata: Metadata = {
  title: "Nosotros",
};

export default function Page() {
  return (
    <>
      <PageHero
        description={
          <p>
            Somos una empresa peruana, con experiencia en diagnóstico de
            brechas sociales, elaboración de procesos, desarrollo de software e
            implementación de alta tecnología en el mercado nacional e
            internacional.
          </p>
        }
        eyebrow="Nosotros"
        image={NosotrosImg}
        imageAlt="Equipo de HERCOM"
        imageClassName="object-[50%_35%]"
        title="Cuidamos de ti y de tu familia"
      />

      <section className="section pb-16 lg:pb-24">
        <div className="rounded-3xl bg-default-100 p-8 dark:bg-default-50 lg:p-12">
          <p className="max-w-4xl text-lg leading-relaxed lg:text-xl">
            Contamos con un equipo de profesionales que nos permite garantizar
            aportes a una sociedad moderna con soluciones móviles e
            inteligentes y complementándolos con otros servicios como es hoy en
            día la inseguridad por la que atravesamos.
          </p>
        </div>
      </section>

      <section className="section grid gap-10 pb-16 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:pb-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sobre la App
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-default-600">
          <p>
            APP HERCOM - CHOFERES PARA REMPLAZO es un aplicativo móvil que fue
            estudiado y desarrollado para mitigar una brecha social como son los
            ACCIDENTES DE TRANSITO, causados por diferentes maniobras al volante
            como fue desde el año 1896 en New York - EE. UU, donde se realizaban
            las primeras pruebas de vehículos a motor y remontando a la
            actualidad, donde los accidentes de tránsito son ocasionados en su
            mayoría por la ingesta de alcohol, en otros casos por descuido o por
            una distracción al volante o como también por el stres que
            actualmente vivimos.
          </p>
          <p>
            La APP HERCOM - CHOFER PARA REMPLAZO, es el inicio de querer
            profesionalizar a la persona que va al volante y te ofrece su
            servicio en las distintas opciones que te presentamos. Impulsaremos
            acciones preventivas de seguridad física, seguridad médica y
            seguridad social. La APP está diseñada para sugerir acciones móviles
            que nos permita llegar sanos y salvos a casa.
          </p>
        </div>
      </section>

      <section className="section grid gap-10 pb-16 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:pb-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ¿Por qué &quot;remplazo&quot;?
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-default-600">
          <p>
            Sobre CHOFER PARA REMPLAZO, la RAE (Real Academia Española) acepta
            ambos términos a utilizar en una oración como reemplazo y remplazo;
            hemos querido trabajar con una sola &apos;E&apos; en el término
            remplazo, porque nosotros somos consientes que vamos a conducir un
            vehículo que necesita de nosotros, de nuestro profesionalismo y no
            consideramos estar definidos como una segunda opción de reemplazar a
            alguien.
          </p>
          <p>
            Nuestros servicios pueden ser programados en la APP o en la Central
            Telefónica con anticipación y de esta manera prevenir cualquier tipo
            de accidente de tránsito. Trabajamos las 24 horas del día con la
            finalidad de contar siempre con nuestros choferes y no solo depender
            de una póliza. Por la que muchos por sentirse obligados a pagar mes a
            mes optan por manejar sin la lucidez necesaria y luego ocasionando
            desastres familiares como también desastres sociales (accidentes,
            multas, o hasta la muerte). Podrás contar con nuestros servicios
            desde ya, desde tu móvil, desde tu casa.
          </p>
        </div>
      </section>
    </>
  );
}
