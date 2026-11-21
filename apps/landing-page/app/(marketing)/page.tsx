import Image from "next/image";
import NextLink from "next/link";

import {
  HeartFilledIcon,
  PhoneCheckIcon,
  SecurityIcon,
  ThumbsUpIcon,
} from "@/components/icons";
import { Faqs } from "@/components/faqs";
import { StoreBadges } from "@/components/store-badges";
import ServiciosImg from "@/assets/servicios_background.png";
import NosotrosImg from "@/assets/nosotros_background.png";
import ClienteImg from "@/assets/cliente_background.png";

const REASONS = [
  {
    icon: <PhoneCheckIcon size={28} />,
    title: "Comodidad",
    description:
      "Te llevamos a ti y a tu familia a tu destino en la comodidad de tu propio vehiculo",
  },
  {
    icon: <SecurityIcon size={28} />,
    title: "Prevención",
    description:
      "Evita poner tu vida en riesgo o la vida de los demas. Evita las multas y terminar en la cárcel.",
  },
  {
    icon: <ThumbsUpIcon size={28} />,
    title: "En un solo click",
    description:
      "Descarga nuestro aplicativo y en un solo click podrás llamar a nuestros Choferes para Remplazo",
  },
];

const DISCOVER = [
  {
    title: "Nosotros",
    description: "Una empresa peruana que trabaja para mitigar los accidentes de tránsito.",
    href: "/nosotros",
    image: NosotrosImg,
    imageClassName: "object-[50%_35%]",
  },
  {
    title: "Cuidando vidas",
    description: "Si vas a beber, no tomes el volante. Tu familia te espera en casa.",
    href: "/cuidando-vidas",
    image: ClienteImg,
    imageClassName: "object-[40%_40%]",
  },
];

const SAFETY = [
  {
    icon: <ThumbsUpIcon size={24} />,
    title: "Choferes calificados",
    description: "Nuestros choferes son evaluados antes de manejar tu vehículo.",
  },
  {
    icon: <PhoneCheckIcon size={24} />,
    title: "Comparte tu viaje",
    description: "Tu familia puede seguir el recorrido en vivo hasta que llegues.",
  },
  {
    icon: <SecurityIcon size={24} />,
    title: "PIN de seguridad",
    description: "Confirma con un PIN que el chofer que llega es el asignado.",
  },
  {
    icon: <HeartFilledIcon size={24} />,
    title: "Disponible 24/7",
    description: "La app funciona las 24 horas, los 7 días de la semana.",
  },
];

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 transition-transform group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

const sectionTitle =
  "text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl";

export default function Home() {
  return (
    <>
      <section className="section grid items-center gap-10 pb-12 pt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-20 lg:pt-14">
        <div className="flex flex-col items-start">
          <h1 className="text-[2.75rem] font-bold leading-[1.04] tracking-tight sm:text-6xl xl:text-7xl">
            Cuidamos de ti y de tu familia
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-default-600">
            HERCOM - Chofer para Remplazo, es la App que mitiga los Accidentes
            de Tránsito, Multas innecesarias y Problemas Legales en nuestra
            sociedad.
          </p>
          <p className="mt-4 text-lg font-semibold">
            No te compliques la vida, antes de tomar el volante...
          </p>
          <div className="mt-8">
            <NextLink
              className="rounded-full bg-primary px-7 py-3.5 font-semibold text-white transition-colors hover:bg-primary-600"
              href="#descarga"
            >
              Descargar la app
            </NextLink>
          </div>
          <StoreBadges className="mt-8" />
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-default-100">
          <Image
            fill
            priority
            alt="Chofer HERCOM manejando el vehículo de un cliente"
            className="object-cover object-[60%_40%]"
            placeholder="blur"
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={ServiciosImg}
          />
        </div>
      </section>

      <section className="section py-16 lg:py-24" id="porque-elegirnos">
        <h2 className="text-center font-bold leading-tight tracking-tight whitespace-nowrap text-[clamp(0.7rem,3.4vw,3rem)]">
          ¿Por qué elegir un chofer para remplazo HERCOM?
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REASONS.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-default-100 p-8 dark:bg-default-50"
            >
              <div className="text-primary">{item.icon}</div>
              <h3 className="mt-8 text-xl font-bold">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-default-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-default-100/70 py-16 dark:bg-default-50/50 lg:py-24">
        <div className="section">
          <h2 className={sectionTitle}>Conoce HERCOM</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {DISCOVER.map((item) => (
              <NextLink key={item.href} className="group" href={item.href}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-default-200">
                  <Image
                    fill
                    alt={item.title}
                    className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${item.imageClassName}`}
                    placeholder="blur"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={item.image}
                  />
                </div>
                <h3 className="mt-5 flex items-center gap-2 text-xl font-bold">
                  {item.title} <ArrowIcon />
                </h3>
                <p className="mt-1.5 text-default-600">{item.description}</p>
              </NextLink>
            ))}
          </div>
        </div>
      </section>

      <section className="section py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <h2 className={sectionTitle}>Tu seguridad es nuestra prioridad</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-default-600">
              Cada servicio está pensado para que tú y los tuyos regresen a
              casa sanos y salvos.
            </p>
          </div>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {SAFETY.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="grid h-12 w-12 min-w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 leading-relaxed text-default-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pb-16 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <h2 className={sectionTitle}>Absolvemos tus dudas</h2>
          <Faqs />
        </div>
      </section>

      <section className="section pb-16 lg:pb-24" id="descarga">
        <div className="rounded-[2rem] bg-primary px-6 py-14 text-white sm:px-12 lg:px-16 lg:py-20">
          <div className="max-w-3xl">
            <h2 className={sectionTitle}>¡Haz tu viaje más seguro ahora!</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/85">
              Nadie está libre de los Accidentes de Tránsito, pero sí podemos
              mitigarlos con tu aplicación móvil HERCOM - Chofer para Remplazo.
              Ahora tu tranquilidad y la de tu familia está en tus manos.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-white/85">
              Descarga la App HERCOM - Chofer para Remplazo y accede a nuestros
              servicios exclusivos. Nuestros Choferes son previamente
              calificados y te llevarán a donde vayas.
            </p>
            <p className="mt-6 text-xl font-bold">
              Evitar es de inteligentes, Prevenir es de sabios
            </p>
            <StoreBadges className="mt-8" />
          </div>
        </div>
      </section>
    </>
  );
}
