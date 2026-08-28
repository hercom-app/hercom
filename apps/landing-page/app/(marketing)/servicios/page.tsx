import { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@nextui-org/card";

import { title } from "@/components/primitives";
import {
  BusinessIcon,
  PremiumIcon,
  ReplaceTaxi,
  SecurityIcon,
  VehicleTruckIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Nuestros Servicios",
};

export default function Page() {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/servicios_background.png)] bg-cover bg-[90%_50%] md:bg-[50%_12%]">
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
              ¡Encuentra el servicio perfecto en la comodidad de tu propio
              vehículo!
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
          Nuestros Servicios
        </h2>
        <p className="text-balance text-lg text-center">
          Actualmente contamos con líneas de negocios de Choferes para los
          diversos sectores de público que el mercado por hoy nos exige:
        </p>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-8">
          {[
            {
              icon: <ReplaceTaxi className="text-primary" size={52} />,
              title: "Chofer para Remplazo",
              description: [
                "Viaja sin stres del tránsito, en la comodidad de tu vehículo con tu APP HERCOM.",
                "Descárgalo desde tu celular de manera gratuito y comienza a disfrutar de nuestros servicios.",
              ],
            },
            {
              icon: <BusinessIcon className="text-primary" size={52} />,
              title: "Chofer Corporativo",
              description: [
                "Reserva tus servicios con anticipación desde la comodidad de tu casa u oficina.",
                "Te trasladamos a tus actividades como: al aeropuerto, directorios, ceremonias, bodas, conferencias, entre otros requerimientos que Ud. planifique.",
                "Contáctate para mayor información con uno de nuestros ejecutivos.",
              ],
            },
            {
              icon: <SecurityIcon className="text-primary" size={52} />,
              title: "Chofer Seguro",
              description: [
                "Si requiere de protección para el traslado de un bien u objetos; contamos con el servicio de Chofer Seguro, como también de un equipo de profesionales para una seguridad privada.",
                "Contáctate para mayor información con uno de nuestros ejecutivos.",
              ],
            },
            {
              icon: <VehicleTruckIcon className="text-primary" size={52} />,
              title: "Chofer de Flota",
              description: [
                "Son los profesionales de ruta larga o especificaciones especiales para el traslado de maquinarias, buses, tráiler, entre otros equipos de flota requeridas a nuestra central.",
                "Contáctate para mayor información con uno de nuestros ejecutivos.",
              ],
            },
            {
              icon: <PremiumIcon className="text-primary" size={52} />,
              title: "Chofer Premium",
              description: [
                "Contamos con una base de datos de Choferes capacitados para cubrir requerimientos específicos por el usuario.",
                "Recomendados por: su grado de valores y de educación, idiomas, primeros auxilios, licencia de armas, disponibilidad de tiempo para viajar al interior o exterior del país, entre otras características exigidas por un mercado inseguro y muy competitivo.",
                "Contáctate para mayor información con uno de nuestros ejecutivos.",
              ],
            },
          ].map((item, index) => (
            <Card
              key={index}
              className="col-span-1 lg:col-span-4 last:lg:col-span-6 last:lg:col-start-2"
            >
              <CardHeader className="lg:hidden flex flex-col items-center">
                {item.icon}
                <h2 className="font-semibold">{item.title}</h2>
              </CardHeader>
              <CardBody className="flex flex-row items-center gap-10 p-5">
                <div className="max-lg:hidden flex flex-col items-center p-5 bg-primary/25 rounded-lg min-w-36">
                  {item.icon}
                  <h2 className="font-semibold text-center">{item.title}</h2>
                </div>
                <div className="flex flex-col items-start gap-0">
                  {item.description.map((text, idx) => (
                    <p key={index + "-" + idx} className="text-sm text-balance">
                      {text}
                    </p>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
