import { Metadata } from "next";

import { title } from "@/components/primitives";

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
      <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-neutral-200 bg-[url(../../assets/nosotros_background.png)] bg-cover bg-center pt-16 -mt-16 dark:bg-neutral-900">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section relative z-[3] flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center">
          <h1
            className={title({
              class: "text-center font-bold text-balance",
              size: "lg",
            })}
          >
            Cuidando vidas
          </h1>
        </div>
      </main>
      <section className="section py-10 lg:py-20 space-y-8">
        <h2
          className={title({
            size: "xs",
            fullWidth: true,
            class: "text-center",
          })}
        >
          Tomar y manejar no es una anécdota
        </h2>
        <p className="text-balance text-lg lg:text-center">
          Si vas a beber, no tomes el volante. Un chofer de remplazo maneja tu
          auto y tú llegas. Estas son las consecuencias de no parar a tiempo.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {RISKS.map((risk) => (
            <article
              key={risk.title}
              className="rounded-2xl bg-neutral-100 px-5 py-5 dark:bg-neutral-800"
            >
              <h3 className="text-lg font-semibold">{risk.title}</h3>
              <p className="mt-2 text-balance">{risk.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
