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
            Somos una empresa que trabaja pensando por el bienestar de tu
            familia; impulsando desde tu celular el proyecto HERCOM – Chofer
            para remplazo, queremos llegar a tu hogar para que desde una
            aplicación móvil puedas llevar o traer a tus familiares en la
            comodidad de tu propio vehículo.
          </p>
        }
        eyebrow="Nosotros"
        image={NosotrosImg}
        imageAlt="Equipo de HERCOM"
        imageClassName="object-[50%_35%]"
        title="Cuidamos de ti y de tu familia"
      />

      <section className="section grid gap-10 pb-16 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:pb-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sobre la App
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-default-600">
          <p>
            Los accidentes de tránsito causados por el estrés, el agotamiento o
            el alcohol se pueden prevenir. Por eso creamos App Hercom – Choferes
            de Reemplazo, una solución móvil diseñada para proteger tu vida
            poniendo a un conductor profesional al volante de tu propio auto.
          </p>
          <p>
            Nuestro compromiso va más allá del traslado: profesionalizamos la
            labor del chofer mediante estándares de seguridad física, médica y
            social, creando un ecosistema pensado para que tú y tu equipo
            vuelvan siempre sanos y salvos a casa.
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
