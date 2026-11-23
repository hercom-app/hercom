import { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import CuidandoVidasImg from "@/assets/cliente_background.png";

export const metadata: Metadata = {
  title: "Cuidando vidas",
  description:
    "Tomar y manejar puede terminar en un accidente, una multa, la cárcel o la muerte. Hercom cuida esa decisión.",
};

const RISKS = [
  {
    title: "Accidentes",
    body: "El alcohol baja los reflejos y la lectura de la vía. Un segundo de más al volante alcanza para chocar, atropellar o salir de la pista.",
  },
  {
    title: "Muerte",
    body: "No es una multa que se paga y se olvida. Hay choques en los que alguien no vuelve a casa: quien maneja, quien va en el auto o quien cruzaba la calle.",
  },
  {
    title: "Multa",
    body: "Conducir bajo los efectos del alcohol es una infracción. La papeleta, el internamiento del vehículo y el récord quedan, aunque esa noche parezca que no pasó nada.",
  },
  {
    title: "Cárcel",
    body: "Si el resultado es un lesionado o una muerte, el caso deja de ser una papeleta. Puede haber detención, proceso penal y prisión.",
  },
  {
    title: "Arma",
    body: "Un auto en manos de quien no está en condiciones de manejar se vuelve un arma. Hercom existe para que esa arma no la conduzcas tú.",
  },
] as const;

export default function Page() {
  return (
    <>
      <PageHero
        description={
          <p>
            Si vas a beber no tomes el volante. Un chofer para remplazo te
            llevará de regreso con tu familia en la comodidad de tu propio
            vehículo.
          </p>
        }
        eyebrow="Cuidando vidas"
        image={CuidandoVidasImg}
        imageAlt="Familia viajando segura con HERCOM"
        imageClassName="object-[40%_40%]"
        title="Tomar y manejar no es una anécdota"
      />
      <section className="section pb-16 lg:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cuida tu vida y la vida de los demás.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-default-600">
            Estas son las consecuencias reales por conducir en un estado
            inapropiado o por tomar una mala decisión al volante.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RISKS.map((risk, index) => (
            <article
              key={risk.title}
              className="rounded-3xl bg-default-100 p-8 dark:bg-default-50"
            >
              <span className="text-sm font-bold text-primary">
                0{index + 1}
              </span>
              <h2 className="mt-4 text-xl font-bold">{risk.title}</h2>
              <p className="mt-2 leading-relaxed text-default-600">
                {risk.body}
              </p>
            </article>
          ))}
          <div className="flex flex-col justify-between rounded-3xl bg-primary p-8 text-white">
            <p className="text-xl font-bold leading-snug">
              Pide un chofer y llega a casa en la comodidad de tu propio auto
            </p>
            <a
              className="mt-6 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary"
              href="/#descarga"
            >
              Descarga la app
            </a>
          </div>
        </div>
      </section>
    </>
  );
}