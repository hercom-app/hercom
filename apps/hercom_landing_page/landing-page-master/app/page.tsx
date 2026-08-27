import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { title, subtitle } from "@/components/primitives";
import { Phone } from "@/components/phone";
import {
  BusinessIcon,
  LogosApple,
  LogosGooglePlay,
  PhoneCheckIcon,
  PremiumIcon,
  SecurityIcon,
  ThumbsUpIcon,
  VehicleTruckIcon,
} from "@/components/icons";
import { GlobeDemo } from "@/components/globe";
import { Faqs } from "@/components/faqs";

export default function Home() {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/map-light.webp)] dark:bg-[url(../assets/map-dark.webp)] bg-cover">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="section h-full">
          <div className="flex flex-col items-center justify-between h-full lg:flex-row lg:gap-20">
            <div className="flex flex-col max-lg:items-center max-[400px]:pt-10 pt-[10vh]">
              <h1
                className={title({
                  class: "max-lg:text-center lg:font-bold lg:text-balance",
                  size: "lg",
                })}
              >
                Cuidamos de ti <br /> y de tu familia
              </h1>
              <div
                className={subtitle({
                  class:
                    "mt-4 max-lg:hidden lg:text-sm lg:text-balance lg:max-w-xl",
                })}
              >
                HERCOM - Chofer para Remplazo, es la App que mitiga los
                Accidentes de Tránsito, Multas innecesarias y Problemas Legales
                en nuestra sociedad.
              </div>
              <div
                className={subtitle({
                  class: "mt-4 max-lg:text-center lg:text-lg font-semibold ",
                })}
              >
                No te compliques la vida, antes de tomar el volante...
              </div>
              <div className="flex gap-3 mt-8">
                <Link
                  className={buttonStyles({
                    color: "primary",
                    radius: "full",
                  })}
                  href="#descarga"
                >
                  Descargar la app ya!
                </Link>
                {/* <Link
                  className={buttonStyles({ 
                    radius: "full",
                  })}
                  href="#porque-elegirnos"
                >
                  Conoce a HERCOM
                </Link> */}
              </div>
            </div>
            <Phone />
          </div>
        </div>
      </main>
      <section className="section py-10 lg:py-20" id="porque-elegirnos">
        <h2
          className={title({
            size: "xs",
            fullWidth: true,
            class: "text-center",
          })}
        >
          ¿Por qué elegir a HERCOM - Chofer para Remplazo?
        </h2>
        <div className="flex flex-col items-center gap-10 pt-10 lg:gap-0 lg:flex-row lg:justify-between">
          {[
            {
              icon: <PhoneCheckIcon className="z-[2]" size={32} />,
              title: "Comodidad",
              description:
                "Te llevamos a ti y a tu familia a tu destino en la comodidad de tu propio vehiculo",
            },
            {
              icon: <SecurityIcon className="z-[2]" size={32} />,
              title: "Prevención",
              description:
                "Evita poner tu vida en riesgo o la vida de los demas. Evita las multas y terminar en la cárcel.",
            },
            {
              icon: <ThumbsUpIcon className="z-[2]" size={32} />,
              title: "En un solo click",
              description:
                "Descarga nuestro aplicativo y en un solo click podrás llamar a nuestros Choferes para Remplazo",
            },
          ].map((item, index) => (
            <div key={index} className="group flex flex-col gap-6 items-center">
              <div className="bg-neutral-200 dark:bg-neutral-800 rounded-lg w-16 aspect-square grid place-items-center lg:group-hover:bg-primary relative lg:duration-300 lg:group-hover:text-white">
                <div className="absolute z-[1] w-full h-full top-0 left-0 lg:group-hover:bg-primary-500 group-hover:blur-md duration-300 rounded-lg" />
                {item.icon}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="font-semibold text-lg">{item.title}</span>
                <p className="text-center max-w-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        className="w-full bg-primary/25 py-10 lg:py-20"
        id="nuestros-servicios"
      >
        <div className="section flex flex-col items-center gap-5 lg:gap-10">
          <h2
            className={title({
              size: "xs",
              class: "max-lg:text-center",
            })}
          >
            Descubre Nuestros Servicios
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              {
                icon: <SecurityIcon size={40} />,
                title: "Chofer Seguro",
                description: [
                  "Si necesitas protección adicional, nuestro servicio de Chofer Seguro te brinda un conductor especializado con licencia para el uso de armas.",
                  "Ideal para el traslado de bienes valiosos u objetos de alto riesgo, garantizando tu seguridad en todo momento.",
                ],
              },
              {
                icon: <VehicleTruckIcon size={40} />,
                title: "Chofer de Flota",
                description: [
                  "¿Tienes una carga pesada o una ruta larga?",
                  "Nuestros Choferes de Flota son expertos en traslados de gran escala, como carga pesada y equipos especiales.",
                  "Cuentan con experiencia en rutas largas y están equipados para cumplir con las especificaciones más exigentes.",
                ],
              },
              {
                icon: <BusinessIcon size={40} />,
                title: "Chofer Corporativo",
                description: [
                  "Reserva tu chofer con Chofer Corporativo y disfruta de un servicio anticipado desde la comodidad de tu casa u oficina.",
                  "Este servicio está diseñado para ejecutivos y empresarios que necesitan transporte para eventos, reuniones u otros requerimientos de planificación.",
                ],
              },
              {
                icon: <PremiumIcon size={40} />,
                title: "Chofer Premium",
                description: [
                  "Chofer Premium ofrece conductores altamente capacitados para satisfacer las necesidades más exclusivas.",
                  "Con formación en ética, idiomas, primeros auxilios y licencia de armas, nuestros choferes están disponibles para viajar dentro y fuera del país, adaptándose a un mercado competitivo y de alta demanda.",
                ],
              },
            ].map((item, index) => (
              <div
                key={index}
                className="col-span-1 flex gap-2.5 items-start lg:gap-5"
              >
                <div className="bg-primary rounded-lg w-16 aspect-square grid place-items-center text-white min-w-16">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  {item.description.map((desc, id) => (
                    <p key={id} className="text-balance text-small">
                      {desc}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section py-10 lg:py-20">
        <div className="flex flex-col items-center gap-5 lg:flex-row">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <h2
              className={title({
                size: "xs",
                class: "max-lg:text-center",
              })}
            >
              Tenemos cobertura internacional
            </h2>
            <p className="max-lg:text-center mt-5 text-small lg:text-base text-balance">
              Hercom - Chofer para Remplazo se encuentra expandiéndose en Perú,
              Colombia, Chile y México, incorporando prevención a los accidentes
              de tránsito.
            </p>
            <p className="max-lg:text-center text-small lg:text-base text-balance">
              Estamos comprometidos con tu bienestar y el de tu familia,
              trabajamos constantemente en nuestro laboratorio tecnológico para
              brindar una propuesta al desarrollo social en mitigar los riesgos
              por accidentes de tránsito.
            </p>
            <p className="max-lg:text-center text-small lg:text-base text-balance">
              Con planes de expansión comercial en marcha, pronto podrás
              disfrutar de HERCOM - Chofer para Remplazo en más destinos de la
              región garantizando que los tuyos regresarán a casa sanos y
              salvos.
            </p>
          </div>
          <div className="h-72 pointer-events-none lg:h-[500px] lg:aspect-square">
            <GlobeDemo />
          </div>
        </div>
      </section>
      <section className="section pb-10 lg:pb-20 flex flex-col items-center gap-10">
        <h2
          className={title({
            size: "xs",
            class: "max-lg:text-center",
          })}
        >
          Absolvemos tus dudas
        </h2>
        <Faqs />
      </section>
      <section
        className="relative w-full bg-neutral-200 dark:bg-neutral-900 bg-[url(../assets/map-light.webp)] dark:bg-[url(../assets/map-dark.webp)] bg-cover"
        id="descarga"
      >
        <div className="section pt-10 pb-12 lg:pt-20 lg:pb-24 flex flex-col items-center gap-10">
          <h2
            className={title({
              size: "xs",
              class: "max-lg:text-center",
            })}
          >
            ¡Haz tu viaje más seguro ahora!
          </h2>
          <p className="text-center text-balance text-small lg:text-base">
            Nadie está libre de los Accidentes de Tránsito, pero sí podemos
            mitigarlos con tu aplicación móvil HERCOM - Chofer para Remplazo.
            Ahora tu tranquilidad y la de tu familia está en tus manos.
          </p>
          <p className="text-center text-balance text-small lg:text-base">
            Descarga la App HERCOM - Chofer para Remplazo y accede a nuestros
            servicios exclusivos. Nuestros Choferes son previamente calificados
            y te llevarán a donde vayas.
          </p>
          <p className="text-center text-balance lg:text-lg font-semibold">
            Evitar es de inteligentes, Prevenir es de sabios
          </p>
          <div className="flex items-center gap-10">
            <Link
              isExternal
              className={buttonStyles({
                color: "primary",
                radius: "full",
                className: "bg-black flex items-center gap-2 relative px-5",
              })}
              href="https://play.google.com/store/"
            >
              <LogosGooglePlay className="text-xl" />
              <div className="flex flex-col ">
                <span className="top-0 text-[10px] leading-none">
                  Disponible en
                </span>
                <span className="font-semibold text-white">Google Play</span>
              </div>
            </Link>
            <Link
              isExternal
              className={buttonStyles({
                color: "primary",
                radius: "full",
                className: "bg-black flex items-center gap-2 relative px-5",
              })}
              href="https://www.apple.com/la/app-store/"
            >
              <LogosApple className="text-xl text-white" />
              <div className="flex flex-col ">
                <span className="top-0 text-[10px] leading-none">
                  Descargalo en el
                </span>
                <span className="font-semibold text-white">App Store</span>
              </div>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-primary to-transparent" />
      </section>
    </>
  );
}
