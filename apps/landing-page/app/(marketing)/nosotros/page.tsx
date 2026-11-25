import { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import NosotrosImg from "@/assets/nosotros_background.png";

export const metadata: Metadata = {
  title: "Nosotros",
};

const WHARTON_COMMITMENT =
  "El profesionalismo y la comodidad serán parte de los servicios, contamos con una base de datos filtrada de choferes a nivel nacional; nuestro socio estratégico, el estudio Wharton & asociados, es el responsable de la selección y reclutamiento de los choferes. Es importante poder contar con su participación para lograr superar desafíos que el mercado de hoy nos exige. La importancia del uso del aplicativo Hercom – Chofer para remplazo es poder cerrar una brecha social que son los ACCIDENTES DE TRANSITO por los diferentes motivos sociales ocasionado.";

export default function Page() {
  return (
    <>
      <PageHero
        description={
          <p>
            Somos una empresa que trabaja pensando por el bienestar de tu
            familia; impulsando desde tu celular el uso del aplicativo HERCOM
            – Chofer para remplazo; queremos llegar a tu hogar para que desde
            una aplicación móvil puedas llevar o traer a tus familiares con
            choferes calificados en la comodidad de tu propio vehículo.
          </p>
        }
        image={NosotrosImg}
        imageAlt="Equipo de HERCOM"
        imageClassName="object-[50%_35%]"
        title="Cuidamos de ti y de tu familia"
      />

      <section className="section pb-12 lg:pb-16">
        <div className="overflow-hidden rounded-[2rem] border border-default-200/80 bg-default-100 dark:border-default-100 dark:bg-default-50">
          <div className="grid lg:grid-cols-[auto_1fr]">
            <div className="flex items-center bg-primary px-8 py-10 text-primary-foreground lg:max-w-xs lg:px-10 lg:py-12">
              <p className="text-2xl font-bold leading-snug tracking-tight">
                Puntualidad y Confianza
              </p>
            </div>
            <div className="px-8 py-10 lg:px-12 lg:py-12">
              <p className="text-lg leading-relaxed text-default-600">
                {WHARTON_COMMITMENT}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section grid gap-10 pb-16 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:pb-24">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sobre la App
        </h2>
        <div className="space-y-5 text-lg leading-relaxed text-default-600">
          <p>
          Los accidentes de tránsito causados por el estrés, el agotamiento o el alcohol se pueden prevenir. Para superar este desafío; se creó la app HERCOM - Chofer para remplazo, una solución móvil diseñada para cuidar tu vida y la vida de los demás; donde podrás ubicar de la manera más simple y sencilla a un chofer profesional para la conducción de tu volante y de esa forma mitigaras riesgos de accidentes de tránsito.
          </p>
          <p>
          Nuestro compromiso va más allá del traslado: profesionalizamos la labor del chofer mediante estándares de seguridad física, médica y social, creando un ecosistema pensado para que tú y tu familia vuelvan siempre a casa.
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
            Estamos disponibles las 24 horas para que nunca tengas que ponerte al
            volante si estás cansado, estresado o no te sientes con la lucidez
            necesaria. Con HERCOM - Chofer para Remplazo no dependes de pólizas
            mensuales ni ataduras para cuidar tu vida y evitar accidentes;
            puedes pedir o programar un conductor al instante desde nuestra App
            cuando lo necesites.
          </p>
          <p>
            Y si buscas una atención a medida, desde nuestra web también puedes
            solicitar nuestros servicios especializados de Chofer Corporativo,
            Chofer Premium, Chofer Seguro y Chofer de Flota, adaptados tanto a
            tus requerimientos personales como a la operación de tu empresa.
          </p>
        </div>
      </section>
    </>
  );
}
