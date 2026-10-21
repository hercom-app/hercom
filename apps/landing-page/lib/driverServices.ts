export type DriverService = {
  slug: string;
  title: string;
  audience: string;
  description: string[];
  lead: string;
  points: string[];
};

export const replacementDriver = {
  title: "Chofer para Remplazo",
  description: [
    "Viaja sin stres del tránsito, en la comodidad de tu vehículo con tu APP HERCOM.",
    "Descárgalo desde tu celular de manera gratuito y comienza a disfrutar de nuestros servicios.",
  ],
};

export const driverServices: DriverService[] = [
  {
    slug: "chofer-premium",
    title: "Chofer Premium",
    audience: "Para personas",
    description: [
      "Contamos con una base de datos de Choferes capacitados para cubrir requerimientos específicos por el usuario.",
      "Recomendados por: su grado de valores y de educación, idiomas, primeros auxilios, licencia de armas, disponibilidad de tiempo para viajar al interior o exterior del país, entre otras características exigidas por un mercado inseguro y muy competitivo.",
      "Contáctate para mayor información con uno de nuestros ejecutivos.",
    ],
    lead: "Chofer Premium es el servicio para personas que necesitan un conductor a la medida de su rutina y de su familia.",
    points: [
      "Uso personal: traslados del día, compromisos familiares y viajes en los que prefieres no tomar el volante.",
      "Choferes recomendados por sus valores, su educación y los idiomas que hablan.",
      "Preparados en primeros auxilios y con disponibilidad para viajar al interior o al exterior del país.",
      "Cubrimos el requerimiento específico que nos indiques al reservar.",
    ],
  },
  {
    slug: "chofer-corporativo",
    title: "Chofer Corporativo",
    audience: "Para empresas",
    description: [
      "Reserva tus servicios con anticipación desde la comodidad de tu casa u oficina.",
      "Te trasladamos a tus actividades como: al aeropuerto, directorios, ceremonias, bodas, conferencias, entre otros requerimientos que Ud. planifique.",
      "Contáctate para mayor información con uno de nuestros ejecutivos.",
    ],
    lead: "Chofer Corporativo es el servicio para empresas que coordinan traslados con anticipación.",
    points: [
      "Reservas desde la casa o la oficina, antes del día del servicio.",
      "Traslados de empresa: aeropuerto, directorios, ceremonias, bodas, conferencias y otros compromisos que planifiques.",
      "Un ejecutivo de Hercom coordina el servicio con tu empresa.",
    ],
  },
  {
    slug: "chofer-seguro",
    title: "Chofer Seguro",
    audience: "Para empresarios",
    description: [
      "Si requiere de protección para el traslado de un bien u objetos; contamos con el servicio de Chofer Seguro, como también de un equipo de profesionales para una seguridad privada.",
      "Contáctate para mayor información con uno de nuestros ejecutivos.",
    ],
    lead: "Chofer Seguro es el servicio para empresarios que requieren un conductor con licencia para el uso de armas.",
    points: [
      "Traslado de personas y de bienes u objetos que necesitan protección durante el recorrido.",
      "El conductor cuenta con licencia de armas.",
      "Cuando el servicio lo exige, se suma un equipo de profesionales de seguridad privada.",
    ],
  },
  {
    slug: "chofer-de-flota",
    title: "Chofer de Flota",
    audience: "Vehículos especiales",
    description: [
      "Son los profesionales de ruta larga o especificaciones especiales para el traslado de maquinarias, buses, tráiler, entre otros equipos de flota requeridas a nuestra central.",
      "Contáctate para mayor información con uno de nuestros ejecutivos.",
    ],
    lead: "Chofer de Flota es el servicio para el manejo de vehículos especiales y de ruta larga.",
    points: [
      "Maquinaria, buses, tráiler y otros equipos de flota.",
      "Conductores con especificación de ruta larga y de vehículos especiales.",
      "El pedido se coordina con nuestra central.",
    ],
  },
];

export function getDriverService(slug: string) {
  return driverServices.find((service) => service.slug === slug);
}
