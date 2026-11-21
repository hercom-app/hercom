/** Textos legales de HERCOM — Chofer para Remplazo (Perú). */

export const LEGAL_UPDATED = "20 de noviembre de 2026";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: string;
  path: string;
  title: string;
  navLabel: string;
  updated: string;
  lead: string;
  sections: LegalSection[];
};

const SOCIAL = [
  "TikTok: hercomchoferes",
  "Facebook: Hercom – Chofer para Remplazo",
  "Instagram: @hercomperu",
  "YouTube: Hercom Choferes",
];

const GENERAL_TERMS_DOCUMENT: LegalDocument = {
  slug: "terminos",
  path: "/terminos-y-condiciones",
  title: "Términos de Uso",
  navLabel: "Términos de uso",
  updated: LEGAL_UPDATED,
  lead: "HERCOM – Chofer para Remplazo es un aplicativo creado para cuidar de ti y de tu familia. Mitiga los riesgos de los accidentes de tránsito y de sus consecuencias legales, y te traslada en la comodidad de tu vehículo a los destinos que programes. Puedes agendar un chofer para el mismo día o para fechas futuras.",
  sections: [
    {
      id: "servicio",
      title: "1. El servicio",
      blocks: [
        {
          kind: "list",
          items: [
            "No expongas tu vida o la vida de los demás.",
            "Evita los accidentes de tránsito.",
            "Evita las multas.",
            "Evita terminar en la cárcel.",
          ],
        },
        {
          kind: "p",
          text: "La App vincula choferes calificados con los usuarios para un servicio de inicio a fin, en el vehículo del usuario. HERCOM – Chofer para Remplazo no es responsable por daños o perjuicios que pudieran ocasionarse en el despliegue de una ruta.",
        },
        {
          kind: "p",
          text: "Puedes descargar la App en tu celular desde Google Play, App Store y AppGallery, de forma gratuita, o entrar desde www.hercom.pe. El horario de servicio es 24×7, los 365 días del año.",
        },
        { kind: "p", text: "Canales y redes sociales:" },
        { kind: "list", items: SOCIAL },
      ],
    },
    {
      id: "como-pedir",
      title: "2. Cómo pedir un servicio",
      blocks: [
        {
          kind: "p",
          text: "Solicitas el servicio desde la app, ingresas el destino y, si tienes más lugares, los agregas en la misma pantalla. Luego indicas la cantidad de horas y envías el requerimiento para que los choferes lo vean y te hagan una propuesta.",
        },
        {
          kind: "p",
          text: "En esa propuesta el chofer puede incluir costos adicionales, como un taxi, si te encuentras fuera del perímetro de alcance de tu ubicación. La app permite negociar y llegar a un acuerdo directamente con el Chofer para Remplazo.",
        },
        {
          kind: "p",
          text: "Tu vida y la de los demás no tienen precio como para conducir en un estado que no garantice la seguridad vial.",
        },
      ],
    },
    {
      id: "adelanto",
      title: "3. Adelanto y confirmación",
      blocks: [
        {
          kind: "p",
          text: "Cuando ambas partes aceptan iniciar el servicio, el cliente abona el 25% del monto acordado como adelanto a la cuenta bancaria, Yape o Plin del chofer. Sin ese pago, el servicio se tiene por no agendado.",
        },
        {
          kind: "p",
          text: "Si el usuario pide el servicio para un tercero, debe hacer la misma operación por cada servicio. Los pagos generan compromisos y responsabilidades de agenda con el chofer con el que ya coordinó y confirmó.",
        },
      ],
    },
    {
      id: "tiempos",
      title: "4. Tiempos del servicio",
      blocks: [
        {
          kind: "p",
          text: "El servicio tiene un tiempo estimado de salida y de retorno máximo de 2 horas desde el tiempo contratado para la partida. El pasajero puede recargar horas adicionales en la misma app para mantener la seguridad del servicio. Si no recarga, el servicio culmina al agotar el tiempo contratado.",
        },
        {
          kind: "p",
          text: "El tiempo de espera del Chofer para Remplazo es de máximo cinco (05) minutos, salvo coordinación con el mismo chofer para una espera más larga.",
        },
      ],
    },
    {
      id: "tarifas",
      title: "5. Tarifas, cancelación y medios de pago",
      blocks: [
        {
          kind: "p",
          text: "Por política de la empresa se cobra el 25% del monto total acordado como adelanto, y ese pago compromete la agenda u horario del chofer. Si, pasado el periodo de gracia de cinco (05) minutos, ya se asignó un Chofer para Remplazo y el usuario desea cancelar, ese 25% se considera pago de gastos operativos a favor del servicio. Los servicios una vez programados no pueden cancelarse. Los montos pueden variar según la ciudad de destino.",
        },
        {
          kind: "p",
          text: "Las tarifas de cancelación compensan al chofer por el tiempo y el esfuerzo de reservar o de viajar hasta la ubicación requerida. Solicita un servicio solo cuando tengas todo listo para salir.",
        },
        {
          kind: "p",
          text: "Queremos que los precios sean lo más accesibles y justos del mercado. Todos los servicios se pueden pagar con billeteras digitales, transferencias bancarias o en efectivo. La información de la tarjeta se almacena una vez en la reserva y está protegida contra accesos no autorizados, mediante un proveedor de pagos certificado.",
        },
        {
          kind: "p",
          text: "HERCOM se compromete con prácticas comerciales éticas, transparentes y con sistemas seguros de trabajo. El cliente debe conocer sus responsabilidades para un buen uso del servicio.",
        },
      ],
    },
    {
      id: "vehiculo",
      title: "6. Vehículo, documentos y pertenencias",
      blocks: [
        {
          kind: "p",
          text: "Todo objeto de pertenencia del usuario que esté en el vehículo debe declararse en el Checklist al inicio del servicio. Al finalizar, el usuario otorga su conformidad con una calificación en la app, o su queja si corresponde.",
        },
        {
          kind: "p",
          text: "El propietario debe entregar toda la documentación legal del vehículo. Por ningún motivo se traslada un vehículo sin documentación en regla, por considerarse una situación delictiva, sospechosa o de robo. Es una falta muy grave del usuario solicitante, sin derecho a reclamos ni a devolución de pagos.",
        },
        {
          kind: "p",
          text: "El propietario responde por todo lo que se encuentre dentro del vehículo, camioneta, furgón o cualquier modalidad de transporte, sea lícito o ilícito. El Chofer para Remplazo se presenta solo con sus documentos de identificación y su licencia de conducir. Está prohibido que lleve otros objetos o que suban pasajeros ajenos al servicio, salvo comunicación previa con el chofer. Es una falta muy grave del usuario.",
        },
        {
          kind: "p",
          text: "El vehículo debe estar en buenas condiciones mecánicas y con mantenimientos preventivos. Si el cliente es titular, autoriza expresamente al chofer a conducirlo y estacionarlo para el servicio. Si no es titular, debe contar con autorización del titular.",
        },
      ],
    },
    {
      id: "prohibiciones",
      title: "7. Conductas prohibidas",
      blocks: [
        {
          kind: "p",
          text: "Está prohibido que el usuario realice actos obscenos (relaciones sexuales), actos de indisciplina, consumo de drogas o alcohol, o transporte de sustancias o mercaderías ilícitas dentro del vehículo, camioneta, furgón o cualquier modalidad en la que pidió el servicio. Es una falta muy grave. Se comunica a la central de riesgos y el vehículo se deja estacionado en el carril derecho más cercano, sin derecho a reclamos ni a devoluciones.",
        },
        {
          kind: "p",
          text: "El usuario carece de reclamo por esos actos, o por cualquier mandato legal, frente al servicio realizado por el chofer. El servicio garantiza un traslado seguro y cómodo, en condiciones lícitas.",
        },
        {
          kind: "p",
          text: "Como protocolo, queda prohibido que el chofer solicite bajar del vehículo una vez iniciado el Checklist. No puede realizar compras, mandados u otras actividades que lo alejen del vehículo.",
        },
      ],
    },
    {
      id: "seguridad",
      title: "8. Tu seguridad es primero",
      blocks: [
        {
          kind: "p",
          text: "La seguridad es la máxima prioridad. Hay políticas y protocolos para choferes y pasajeros, y la app incorpora funciones de seguridad y guías comunitarias a partir de la experiencia y de las calificaciones de los choferes.",
        },
        {
          kind: "p",
          text: "La app tiene tres botones de emergencia:",
        },
        {
          kind: "list",
          items: [
            "Un botón enlazado al 105 (PNP) ante una acción delictiva en el trayecto.",
            "Un botón de emergencia médica que activa el GPS y muestra la ruta al centro médico u hospital más cercano.",
            "Un botón al 116, cuerpo de bomberos, que comunica con una central de emergencias a nivel nacional.",
          ],
        },
        {
          kind: "p",
          text: "Podrás ver en la app los datos y la fotografía de tu Chofer para Remplazo, y el código de seguridad que solo ustedes comparten. También verás su perfil, su nombre y sus evaluaciones, y podrás compartir la ruta con quien quieras.",
        },
      ],
    },
    {
      id: "datos",
      title: "9. Confidencialidad",
      blocks: [
        {
          kind: "p",
          text: "Por seguridad, la información de clientes y choferes se mantiene confidencial. Ante un incidente, una falta grave o un delito, los documentos se entregan formalmente mediante un certificado de denuncia policial o una denuncia judicial.",
        },
        {
          kind: "p",
          text: "HERCOM es responsable conforme a la Ley de Protección de Datos Personales y a la confidencialidad de los datos. El tratamiento puede variar si se viaja a través de fronteras nacionales, estatales u otras fronteras geográficas, y puede diferir del país o territorio de origen.",
        },
      ],
    },
    {
      id: "choferes",
      title: "10. Choferes",
      blocks: [
        {
          kind: "p",
          text: "Los choferes descargan la app desde el celular o desde www.hercom.pe. Deben llenar sus datos, fotografías, certificados policiales y penales, certificado único laboral, idiomas, licencias de armas y lo que acredite su experiencia, para ser evaluados y capacitados por el socio estratégico, el estudio Wharton & Asociados.",
        },
        {
          kind: "p",
          text: "La capacitación es presencial o remota, sobre el servicio y la atención al cliente. Las reglas de negocio de los choferes están en los Términos de uso para choferes. Costos y beneficios se evalúan para que también puedan participar como chofer seguro, chofer corporativo, chofer de flota o chofer premium.",
        },
        {
          kind: "p",
          text: "En HERCOM trabajamos para que tú y tu familia lleguen salvos a casa.",
        },
      ],
    },
  ],
};

export const PASSENGER_TERMS_DOCUMENT: LegalDocument = {
  slug: "pasajeros",
  path: "/terminos-pasajeros",
  title: "Términos de uso para pasajeros",
  navLabel: "Para pasajeros",
  updated: LEGAL_UPDATED,
  lead: "HERCOM traslada a los usuarios desde el inicio hasta el final del viaje solicitado, en el confort de su propio vehículo o camioneta. La misión es mitigar los accidentes de tránsito y sus consecuencias legales. La visión es profesionalizar el servicio de choferes, con calidad y confianza.",
  sections: [
    {
      id: "app",
      title: "1. La app y los choferes",
      blocks: [
        {
          kind: "p",
          text: "HERCOM – Choferes para Remplazo articula la conducción entre el usuario y un chofer disponible, para el traslado al hogar o al destino requerido.",
        },
        {
          kind: "p",
          text: "Los choferes están registrados en una base de datos. Su información la corrobora y verifica el socio estratégico, el estudio Wharton & Asociados, y los partners nacionales o internacionales cuando corresponde. Esa información se mantiene actualizada. Los choferes son monitoreados, capacitados y evaluados en las fechas u operaciones que se determinen.",
        },
      ],
    },
    {
      id: "inscripcion",
      title: "2. Inscripción",
      blocks: [
        {
          kind: "p",
          text: "Podrá descargar la app desde su celular y completar los campos requeridos.",
        },
        {
          kind: "p",
          text: "Antes de pedir un servicio, el usuario debe conocer estas normas. El lema «Cuidamos de ti y de tu familia» es el compromiso con el que se creó la app.",
        },
        {
          kind: "list",
          items: [
            "Evitas accidentes de tránsito.",
            "Evitas multas o papeletas.",
            "Evitas la retención de tu brevete.",
            "Dejas de depender del amigo elegido.",
            "Evitas terminar en la cárcel.",
          ],
        },
      ],
    },
    {
      id: "politicas",
      title: "3. Políticas de uso",
      blocks: [
        {
          kind: "list",
          items: [
            "Al generar un requerimiento, el usuario se compromete a brindar las facilidades técnicas del vehículo que el chofer necesite para iniciar el recorrido.",
            "Todos los usuarios son bienvenidos al servicio.",
            "El usuario confirma la notificación que el chofer envía al celular desde el que se generó el requerimiento, 5 minutos antes de llegar a la dirección.",
            "Al pedir el servicio por la app o por cualquier canal de venta, el usuario cumple estas políticas.",
            "El 25% de adelanto del acuerdo lo hace responsable de un horario agendado, de un servicio programado y de facilitar que el chofer tome el control del vehículo.",
            "El vehículo o camioneta debe contar con la documentación en regla, según el Reglamento de Tránsito y la normativa aplicable. Si no cumple las condiciones, se entiende como incumplimiento y se procede conforme a las políticas de HERCOM, o como cancelación, y el usuario asume los costos incurridos.",
            "El tiempo de espera es de máximo 5 minutos. Si hay retraso, el usuario se comunica con el chofer que ya sabe que llega al punto de partida.",
            "El chofer no está obligado a comprar gasolina, cambiar llantas, buscar mecánicos por averías ni hacer tareas ajenas al servicio, salvo acuerdo con uno de los choferes.",
            "Son de cuenta del usuario el mantenimiento preventivo, los seguros, los peajes, el combustible y un celular con datos móviles suficientes para la plataforma.",
            "Al entregar las llaves, el chofer revisa el exterior e indica en el Checklist choques, abolladuras o rayones. Luego revisa la maletera: llanta de repuesto, gata, llaves y herramientas, y lo anota en el Checklist.",
            "Si el vehículo ya tiene choques, abolladuras o rayones, el usuario debe informarlo. Se toman fotografías o un video por los cuatro lados, y el chofer queda liberado de responsabilidad por actos anteriores.",
            "Todo objeto que se deje en el vehículo debe mencionarse para el inventario del Checklist. Se sugiere no llevar objetos de valor, sustancias o mercaderías ilícitas. Si no se informa, el usuario solicitante responde ante las autoridades.",
            "Para prolongar el servicio hay que ampliar las horas en la misma app. Si no se hace en la app, no se considera un servicio adicional y se pierde la seguridad y la confianza del servicio.",
            "Al finalizar se envía una calificación por el servicio recibido.",
            "Una vez instalado en el vehículo, el chofer tiene prohibido bajarse a realizar compras. Hacerlo es una falta grave.",
            "Ante una falta grave o un acto indecoroso, el chofer advierte al usuario. Si continúa, hay una segunda advertencia. A la tercera, se estaciona el vehículo en el carril derecho inmediato y se cancela el servicio, sin reclamo. Los gastos del servicio truncado por malas prácticas del usuario se reconocen en un máximo de 24 horas; si no, se siguen las acciones legales pertinentes.",
            "En una emergencia médica, la app inicia el protocolo para llevar al cliente al centro médico más cercano.",
            "Conviene registrar uno o más teléfonos de un familiar o de una persona de contacto.",
            "Si el usuario ingirió bebidas alcohólicas o está delicado de salud, se recomienda que lo acompañe un familiar o una persona de confianza que firme los protocolos. Si va solo, se procede a una grabación con celular o cámara que garantice la ejecución y la conformidad del servicio.",
            "Los choferes serán respetuosos. Pedimos el mismo respeto para seguir trasladándolos a su destino.",
          ],
        },
        {
          kind: "p",
          text: "La App HERCOM – Chofer para Remplazo es el amigo elegido para llevarlo a su casa, al trabajo o al destino final, en la comodidad de su vehículo.",
        },
      ],
    },
    {
      id: "pagos",
      title: "4. Precio y pago",
      blocks: [
        {
          kind: "p",
          text: "El precio es el que se estipula en cada momento en el sitio web y en la app, al contratar con el chofer. Los montos están en la divisa aplicable e incluyen los descuentos y los impuestos vigentes a la fecha del contrato.",
        },
        {
          kind: "p",
          text: "El monto lo sugiere la app y puede variar según las condiciones o los acuerdos con el usuario. Se cobra en efectivo o por transferencia electrónica (Yape, Plin u otro medio electrónico). Para aceptar el servicio, el usuario abona a la billetera digital o cuenta bancaria del chofer el 25% como adelanto. El 75% restante se cancela al culminar el servicio.",
        },
        {
          kind: "p",
          text: "Las horas adicionales, la espera y si corresponde la movilidad para que el chofer llegue al punto (taxi) requieren aprobación previa del cliente. La calificación del usuario en la app permite garantizar el servicio.",
        },
        {
          kind: "p",
          text: "Los servicios diurnos (6:00 a. m. a 9:00 p. m.) toman precios estándar del mercado. En horario nocturno (10:00 p. m. a 5:00 a. m.) puede haber incrementos según zona, distancia u otras características que evalúe la app. En días festivos o feriados el tarifario puede modificarse.",
        },
        {
          kind: "p",
          text: "Aceptar el servicio compromete al usuario a pagar todos los gastos estipulados en estas políticas y cualquier vinculación económica que se acuerde durante el servicio. El usuario actúa en nombre propio al asumir obligaciones o al adquirir el crédito.",
        },
      ],
    },
    {
      id: "cancelacion",
      title: "5. Cancelación",
      blocks: [
        {
          kind: "p",
          text: "Se aplica el 25% del costo como penalidad o gastos operativos si se cancela después del tiempo máximo de espera de 5 minutos, una vez solicitado el servicio.",
        },
        {
          kind: "p",
          text: "Esta política puede verse afectada en estos casos:",
        },
        {
          kind: "list",
          items: [
            "Eventos especiales en la ciudad que afecten la demanda general.",
            "Comportamiento inadmisible del cliente para el desarrollo del servicio.",
            "Otros hechos que afecten la moral o el buen desarrollo del servicio del Chofer para Remplazo.",
          ],
        },
      ],
    },
    {
      id: "tiempos",
      title: "6. Tiempos",
      blocks: [
        {
          kind: "p",
          text: "El servicio tiene un tiempo mínimo de inicio y de fin de 2 horas, contado desde la llegada del chofer al punto requerido hasta el destino final. El pasajero puede recargar horas en la app. Si no recarga, el sistema caduca al tiempo establecido y no cabe reclamo: la app tiene un contador interno para auditoría. La espera máxima es de 5 minutos, salvo coordinación con el chofer responsable.",
        },
        {
          kind: "p",
          text: "Cumplir estas obligaciones permite seguir trabajando en futuros viajes. También existen los servicios de chofer seguro, chofer de flota, chofer corporativo y chofer premium. La información de costos está en el área comercial y en www.hercom.pe.",
        },
        { kind: "list", items: SOCIAL },
      ],
    },
    {
      id: "confidencialidad",
      title: "7. Confidencialidad",
      blocks: [
        {
          kind: "p",
          text: "La información de clientes y choferes se mantiene confidencial. Ante un incidente, una falta grave o un delito, los documentos se entregan mediante un certificado de denuncia policial o una denuncia judicial, conforme a la Ley de Protección de Datos Personales.",
        },
      ],
    },
  ],
};

export const DRIVER_TERMS_DOCUMENT: LegalDocument = {
  slug: "choferes",
  path: "/terminos-choferes",
  title: "Términos de uso para choferes",
  navLabel: "Para choferes",
  updated: LEGAL_UPDATED,
  lead: "HERCOM traslada a los usuarios de inicio a fin, en el confort de su propio vehículo. La misión es mitigar los accidentes de tránsito y sus consecuencias legales. La visión es profesionalizar el servicio, con calidad y confianza.",
  sections: [
    {
      id: "servicio",
      title: "1. Cómo funciona para el chofer",
      blocks: [
        {
          kind: "p",
          text: "Los servicios se ven en la opción Lista del menú. Ahí el chofer recibe los requerimientos y oferta un costo. Los gastos adicionales, como un taxi, no pueden ser mayores al costo mínimo de la tarifa básica de 2 horas.",
        },
        {
          kind: "p",
          text: "La app articula la conducción entre el usuario y un chofer disponible. Desde la inscripción, el chofer responde por sus obligaciones con el usuario final.",
        },
        {
          kind: "p",
          text: "Los choferes se registran en una base de datos del estudio Wharton & Asociados. La información la corroboran los socios estratégicos y se mantiene actualizada. Wharton & Asociados y los partners locales o internacionales monitorean, capacitan y evalúan a los choferes. El profesionalismo abre las líneas de chofer seguro, chofer de flota, chofer corporativo y chofer premium, cada una con sus condiciones, administradas por el área comercial.",
        },
      ],
    },
    {
      id: "inscripcion",
      title: "2. Inscripción y cómo recibir servicios",
      blocks: [
        {
          kind: "p",
          text: "Quien desee ser parte de HERCOM descarga la app y llena los campos para su evaluación. Si cumple los requisitos, puede generar ingresos todos los días del año. También puede postular en www.hercom.pe o en reclutamiento@ricardosymas.com.",
        },
        {
          kind: "p",
          text: "Para recibir servicios en Lista, el chofer desliza el botón de azul a verde. Debe vincular su tarjeta o comprar membresías. Los montos, según tarifarios y ofertas, se ven en su billetera digital. A mayor pago, puede acceder a más promociones o sorteos.",
        },
        {
          kind: "p",
          text: "El lema «Cuidamos de ti y de tu familia» es el compromiso con el que se creó la app. El servicio existe para evitar accidentes de tránsito, multas o papeletas, la retención del brevete, depender del amigo elegido y terminar en la cárcel.",
        },
      ],
    },
    {
      id: "politicas",
      title: "3. Políticas del chofer",
      blocks: [
        {
          kind: "list",
          items: [
            "Cuidar la imagen de la empresa y ofrecer un buen servicio.",
            "Ser parte de HERCOM es integrar la familia empresarial y la familia de quien solicita el servicio.",
            "Cumplir la puntualidad y la dedicación acordadas en todos los servicios.",
            "El 25% de adelanto acordado con el cliente responsabiliza al chofer de un horario, de un servicio y de llevar al usuario a su destino.",
            "Llenar el Checklist antes de cada servicio. Es obligatorio, y la conformidad del usuario genera el pago en la cuenta bancaria o en la billetera digital.",
            "No dejar el vehículo estacionado en lugares prohibidos ni distintos del destino contratado.",
            "El lugar de trabajo es la ruta de inicio a fin de lo requerido.",
            "Conducir respetando las señales de tránsito y la ley.",
            "Si el vehículo sufre un daño por culpa o negligencia comprobada del chofer, este cubre el 100% de la reparación. Igual obligación tiene si maneja a exceso de velocidad o bajo el efecto de algún estupefaciente. Cuando aplique, cubre el 100% del deducible.",
            "Está prohibido hablar o contestar el teléfono personal en horario de servicio. En una emergencia, se estaciona y se llama previa comunicación al usuario.",
            "Garantizar higiene personal, vestimenta y valores. Los choferes se califican de forma constante y pueden ser retirados de la base de datos si incumplen. Se recomienda adquirir camisas, playeras u otros distintivos al menos una vez a la semana, en los puntos de venta autorizados de la web o de la app.",
            "Está prohibido conversar, escuchar o transmitir información personal, empresarial o del cliente en el vehículo. La misión es la confidencialidad y la concentración al volante.",
            "Prohibido ingerir bebidas alcohólicas en un plazo no menor de 48 horas antes del servicio. El incumplimiento restringe de por vida el acceso a la base de datos.",
            "Prohibido el consumo de drogas o estupefacientes antes, durante o después del servicio. Es falta muy grave y causa expulsión. Pueden hacerse pruebas médicas sin aviso previo.",
            "Está prohibido tocar o mover objetos del vehículo, salvo que el usuario pida que se los alcancen. De preferencia se estaciona y el propietario los toma. Si el chofer está solo, queda terminantemente prohibido tocar prendas u objetos. Es falta muy grave: expulsión de por vida y denuncia penal.",
            "La ineficiencia, la falta de calidad o los actos fraudulentos o dolosos en nombre o contra HERCOM causan el retiro de la base de datos.",
            "Si el chofer está solo, tiene prohibido fumar, encender la radio o usar un objeto electrónico que distraiga.",
            "En una emergencia de salud del usuario, el chofer se dirige al centro médico más cercano y comunica a la central de riesgos con carácter muy urgente. La app tiene un botón de asistencia, vía Waze, hacia un hospital, clínica o centro médico.",
            "Combustible, peajes y otros gastos de la ruta los asume el propietario. En un caso extremo sin dinero, los asume el chofer y HERCOM los reembolsa previa verificación.",
            "Ante una falta de disciplina del cliente, el chofer toma medidas preventivas que sustenten los actos y comunica a la central de riesgos.",
            "Una vez recibido el vehículo, el chofer no se baja a hacer compras ni encargos. El servicio es conducir de inicio a fin.",
            "Cambiar las rutas que indica la app es falta muy grave. Tiempos y distancias los monitorea la app, con un margen mínimo de error. De lo contrario se activa el botón de emergencia en coordinación con la PNP.",
            "Está prohibido ingerir comida o bebidas dentro del vehículo. Es falta grave.",
            "Se recomienda conducir a la defensiva y cumplir el reglamento de tránsito en zonas de alta concentración vehicular.",
            "Está prohibido pedir trabajo al usuario, para sí o para un familiar, o entablar conversaciones que lo incomoden. Solo cabe lo propio del servicio, como el Checklist.",
            "La acumulación de faltas graves o muy graves condiciona la expulsión y la pérdida del derecho a reclamos.",
            "La app es un servicio libre de horarios y no genera responsabilidad laboral con la empresa.",
            "El chofer se mantiene informado de las normas de tránsito del MTC.",
            "El chofer cumple lealmente estos deberes y las instrucciones del cargo.",
            "Cualquier prestación o beneficio no señalado se entiende conferido a título personal y no obliga a la empresa.",
          ],
        },
      ],
    },
    {
      id: "pagos",
      title: "4. Pagos",
      blocks: [
        {
          kind: "p",
          text: "El monto lo sugiere la app y puede variar según las condiciones o los acuerdos con el usuario. Se cobra en efectivo o por transferencia electrónica (Yape, Plin u otro medio). Para aceptar el servicio, el usuario abona a la billetera digital o cuenta bancaria del chofer el 25% del costo total como adelanto. La diferencia se completa al culminar.",
        },
        {
          kind: "p",
          text: "Horas adicionales, espera y, si corresponde, la movilidad del chofer hasta el punto (taxi) requieren aprobación previa del cliente. Una buena calificación del usuario permite garantizar el servicio.",
        },
        {
          kind: "p",
          text: "Los servicios diurnos (6:00 a. m. a 9:00 p. m.) toman precios estándar. En horario nocturno (10:00 p. m. a 5:00 a. m.) puede haber incrementos por zona, distancia u otras características. En días festivos o feriados el tarifario puede modificarse.",
        },
        {
          kind: "p",
          text: "HERCOM quiere profesionalizar a cada chofer, con capacitaciones, valores, atención al cliente y nuevas oportunidades que incrementen sus ingresos. Hace falta el compromiso de cuidar el puesto y pensar en el bienestar de su familia.",
        },
      ],
    },
    {
      id: "cancelacion",
      title: "5. Cancelación",
      blocks: [
        {
          kind: "p",
          text: "Se aplica el 25% del costo como penalidad o gastos operativos si el usuario cancela o cambia el servicio después de los 5 minutos de espera máxima. Tiempos, agendas y disposición de los choferes dependen de las reservas programadas. No hay reclamo ni devolución cuando el usuario omite esta política.",
        },
        {
          kind: "list",
          items: [
            "Eventos especiales en la ciudad que afecten la demanda general.",
            "Comportamiento inadmisible del cliente.",
            "Otros hechos que afecten la moral o el buen desarrollo del servicio.",
          ],
        },
      ],
    },
    {
      id: "tiempos",
      title: "6. Tiempos",
      blocks: [
        {
          kind: "p",
          text: "La duración mínima es de 2 horas, contadas desde la llegada del chofer a la dirección requerida hasta el destino final. El usuario puede recargar horas en la app. Si no recarga, el servicio culmina al agotar el tiempo.",
        },
        {
          kind: "p",
          text: "El chofer no debe aceptar propuestas de servicios extras que no administre la app. Es una falta muy grave y puede causar la expulsión de la base de datos de conductores.",
        },
        {
          kind: "p",
          text: "La espera máxima es de 5 minutos, salvo coordinación con el usuario para que recargue en la app.",
        },
      ],
    },
    {
      id: "confidencialidad",
      title: "7. Confidencialidad",
      blocks: [
        {
          kind: "p",
          text: "La información de clientes y choferes se mantiene confidencial. Ante un incidente, una falta grave o un delito, los documentos se entregan mediante un certificado de denuncia policial o una denuncia judicial, conforme a la Ley de Protección de Datos Personales.",
        },
      ],
    },
  ],
};

export const PRIVACY_DOCUMENT: LegalDocument = {
  slug: "privacidad",
  path: "/politica-de-privacidad",
  title: "Política de Privacidad",
  navLabel: "Privacidad",
  updated: LEGAL_UPDATED,
  lead: "En HERCOM reconocemos la importancia de proteger su información personal y nos comprometemos a tratarla con responsabilidad, conforme a la Ley N.° 29733, Ley de Protección de Datos Personales. Esta política regula el tratamiento de los datos de quienes navegan o facilitan sus datos a través de la web y de la app.",
  sections: [
    {
      id: "datos",
      title: "1. Datos personales",
      blocks: [
        {
          kind: "p",
          text: "Un dato personal es la información que identifica o hace identificable a una persona. En las casillas de la web recogemos los datos que el usuario comunica: nombre, apellidos, correo electrónico, teléfono, dirección postal, población y los que voluntariamente proporcione por cualquiera de las redes sociales en las que esté registrado. En ese caso, la privacidad depende de la configuración del usuario y de los términos de la propia red social.",
        },
        {
          kind: "p",
          text: "Visitar la web no obliga a facilitar datos personales. Si se facilitan, se tratan de forma lícita y con sujeción a los principios y derechos de la Ley N.° 29733.",
        },
      ],
    },
    {
      id: "finalidades",
      title: "2. Finalidad, duración y legitimación",
      blocks: [
        {
          kind: "p",
          text: "Atender la solicitud hecha por el formulario de contacto de la web. Conservamos los datos el tiempo necesario para cumplir la petición y el plazo legal, con una duración mínima de 3 años. La base es el consentimiento que el usuario otorga al aceptar esta política antes de enviar la petición. Puede revocarlo en cualquier momento, sin que ello afecte la licitud del tratamiento anterior.",
        },
        {
          kind: "p",
          text: "Enviar publicidad sobre los servicios de HERCOM, solo con consentimiento. Los datos se conservan mientras el usuario no revoque el consentimiento y, como mínimo, 3 años. Puede revocarlo en cualquier momento.",
        },
        {
          kind: "p",
          text: "Gestionar el currículum enviado e incluirlo en la base de candidatos. Se trata durante un máximo de un año y después se bloquea durante el tiempo legal, con respeto a la confidencialidad en el tratamiento y en la destrucción. La base es el consentimiento que se manifiesta al enviarlo y al aceptar esta política. Puede revocarse en cualquier momento.",
        },
        {
          kind: "p",
          text: "Elaborar perfiles a partir de las solicitudes, los intereses y las preferencias, para ofrecer servicios que puedan interesar. Se conservan mientras no se revoque el consentimiento y, como mínimo, 3 años. La base es el consentimiento otorgado en la casilla correspondiente.",
        },
        {
          kind: "p",
          text: "Dar de alta como usuario registrado, para acceder al área privada de servicios e informar de las actividades y novedades por medios electrónicos. Se conservan mientras el usuario no solicite la baja y, como mínimo, 3 años. La base es el consentimiento del registro y de la aceptación de esta política.",
        },
        {
          kind: "p",
          text: "Mejorar la experiencia de navegación. Se conservan mientras el usuario no revoque el consentimiento eliminando las cookies y, como mínimo, 3 años. La base es la aceptación de las cookies.",
        },
        {
          kind: "p",
          text: "Gestionar las redes sociales y enviar información sobre actividades y servicios. Se conservan mientras no se revoque el consentimiento y, como mínimo, 3 años. La base es el consentimiento otorgado para ello.",
        },
        {
          kind: "p",
          text: "Gestionar las reservas y prestar el servicio de Chofer para Remplazo pedido por la app o por la web. Los datos se conservan mientras exista la relación contractual y durante el tiempo legal, con una duración mínima de 3 años. La base es la ejecución del contrato. Si el usuario no facilita sus datos, no se puede gestionar la reserva ni prestar el servicio.",
        },
        {
          kind: "p",
          text: "Gestionar el chat de atención al cliente. Para mejorar el servicio se registra el historial con fines de análisis. Esos registros se eliminan una vez evaluados y cumplido el plazo legal, con una duración mínima de 3 años. La base es el consentimiento para usar el servicio.",
        },
      ],
    },
    {
      id: "cesion",
      title: "3. Cesión y transferencias",
      blocks: [
        {
          kind: "p",
          text: "Los datos no se comunican ni se ceden a terceros, salvo obligación legal o prestadores vinculados al responsable que actúan como encargados del tratamiento.",
        },
      ],
    },
    {
      id: "actualizacion",
      title: "4. Actualización y veracidad",
      blocks: [
        {
          kind: "p",
          text: "Para mantener los datos actualizados, el usuario debe informar cualquier modificación. De lo contrario, HERCOM no responde por su veracidad. El usuario garantiza que los datos son veraces, actualizados y exactos, y que corresponden a su situación real.",
        },
      ],
    },
    {
      id: "terceros",
      title: "5. Datos de terceros",
      blocks: [
        {
          kind: "p",
          text: "Si el usuario facilita datos de otras personas, garantiza que los obtuvo de forma lícita, que informó a los afectados, que obtuvo su consentimiento para comunicarlos y que la información es exacta y veraz.",
        },
      ],
    },
    {
      id: "obligatorios",
      title: "6. Datos obligatorios",
      blocks: [
        {
          kind: "p",
          text: "Los formularios marcan con un asterisco (*) los datos obligatorios. Si el usuario no completa esos campos, o no acepta la política de privacidad, no se permite el envío.",
        },
      ],
    },
    {
      id: "contrasenas",
      title: "7. Contraseñas",
      blocks: [
        {
          kind: "p",
          text: "Para acceder al área privada, el usuario inicia sesión con el correo y la contraseña generada en el registro, según las reglas de complejidad vigentes.",
        },
        {
          kind: "p",
          text: "El usuario custodia sus identificadores y contraseñas, no los cede y no permite el acceso de personas ajenas. Debe avisar de inmediato al responsable ante robo, extravío o acceso no autorizado, para cancelarlos.",
        },
      ],
    },
    {
      id: "derechos",
      title: "8. Derechos",
      blocks: [
        {
          kind: "p",
          text: "Puede acceder a sus datos, obtener confirmación del tratamiento y una copia. Puede actualizarlos, pedir la rectificación de los inexactos y la supresión cuando ya no sean necesarios para la finalidad. Puede pedir la limitación, oponerse y revocar el consentimiento, y ejercer la portabilidad. También puede no ser objeto de decisiones basadas únicamente en un tratamiento automatizado. Ejerce estos derechos contactando con HERCOM.",
        },
      ],
    },
    {
      id: "redes",
      title: "9. Redes sociales",
      blocks: [
        {
          kind: "p",
          text: "Facebook, Instagram, TikTok, YouTube y las demás redes dan visibilidad a las actividades de HERCOM. Esas herramientas almacenan datos en los servidores de cada servicio y se rigen por su propia política. Conviene leer las condiciones y la política de la red al registrarse, y revisar la configuración de privacidad del perfil.",
        },
        {
          kind: "p",
          text: "HERCOM puede eliminar de sus redes la información publicada por terceros que vulnere la ley, incite a hacerlo o atente contra la dignidad de personas o instituciones, y puede bloquear o denunciar el perfil autor de esos mensajes.",
        },
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies",
      blocks: [
        {
          kind: "p",
          text: "Una cookie es un pequeño archivo que se descarga y almacena en el equipo cuando se accede a una página web. Permite almacenar y recuperar información sobre los hábitos de navegación o del equipo y, según su contenido y el uso del equipo, puede servir para reconocer al usuario.",
        },
        {
          kind: "p",
          text: "El usuario puede impedir la generación de cookies desde la opción correspondiente de su navegador.",
        },
      ],
    },
    {
      id: "geolocalizacion",
      title: "11. Geolocalización",
      blocks: [
        {
          kind: "p",
          text: "La aplicación usa geolocalización para informar en tiempo real el estado del viaje, la hora estimada de llegada y la ubicación del Chofer para Remplazo. Para funcionar y dar esa información, la app necesita acceder a la ubicación del dispositivo. Esa información se usa para mejorar la experiencia del viaje y no se comparte con terceros sin consentimiento explícito.",
        },
      ],
    },
  ],
};

function stripNumber(title: string): string {
  return title.replace(/^\d+\.\s*/, "");
}

const CLIENT_SECTION: LegalSection = {
  id: "cliente",
  title: "Para el cliente",
  blocks: [
    {
      kind: "callout",
      text: "El cliente confirma que cuenta con toda la documentación legal de su vehículo: la tarjeta de propiedad, el Seguro Obligatorio de Accidentes de Tránsito (SOAT) y el Certificado de Revisión Técnica.",
    },
    {
      kind: "p",
      text: "Sin esa documentación en regla no se traslada el vehículo, por considerarse una situación delictiva, sospechosa o de robo. Es una falta muy grave del solicitante, sin derecho a reclamos ni a devolución de lo pagado.",
    },
    {
      kind: "p",
      text: "Si el cliente es titular, autoriza al Chofer para Remplazo a conducir y estacionar el vehículo para el servicio. Si no es titular, debe contar con autorización de quien sí lo es. El vehículo debe estar en buenas condiciones mecánicas y con mantenimiento preventivo.",
    },
    {
      kind: "p",
      text: "Todo objeto que esté en el vehículo se declara en el Checklist al inicio. El propietario responde por lo que haya dentro. El chofer se presenta solo con su identificación y su licencia de conducir.",
    },
  ],
};

function asGroup(sections: LegalSection[], group: string): LegalSection[] {
  return sections.map((section) => ({
    ...section,
    id: `${group}-${section.id}`,
    title: `${group}. ${stripNumber(section.title)}`,
  }));
}

export const TERMS_DOCUMENT: LegalDocument = {
  slug: "terminos",
  path: "/terminos-y-condiciones",
  title: "Términos de Uso",
  navLabel: "Términos de uso",
  updated: LEGAL_UPDATED,
  lead: GENERAL_TERMS_DOCUMENT.lead,
  sections: [
    CLIENT_SECTION,
    ...asGroup(PASSENGER_TERMS_DOCUMENT.sections, "Pasajero"),
    ...asGroup(DRIVER_TERMS_DOCUMENT.sections, "Chofer"),
  ].map((section, index) => ({
    ...section,
    title: `${index + 1}. ${section.title}`,
  })),
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  TERMS_DOCUMENT,
  PRIVACY_DOCUMENT,
];

function blockText(block: LegalBlock): string {
  if (block.kind === "p" || block.kind === "callout") return block.text;
  return block.items.map((item) => `• ${item}`).join("\n");
}

export function legalDocumentBody(document: LegalDocument): string {
  return [
    `Última actualización: ${document.updated}.`,
    document.lead,
    ...document.sections.flatMap((section) => [
      section.title,
      ...section.blocks.map(blockText),
    ]),
  ].join("\n\n");
}

export const TERMS_OF_USE = {
  title: TERMS_DOCUMENT.title,
  body: legalDocumentBody(TERMS_DOCUMENT),
};

export const PRIVACY_POLICY = {
  title: PRIVACY_DOCUMENT.title,
  body: legalDocumentBody(PRIVACY_DOCUMENT),
};

/** Autorización que el chofer firma digitalmente al postular (Ley 29733). */
export const DRIVER_PERSONAL_DATA_CONSENT = {
  version: "2026-10",
  checkboxLabel:
    "Firmo digitalmente y autorizo a Hercom el tratamiento de mis datos personales para evaluar mi registro como chofer.",
  fullText: `Autorización de tratamiento de datos personales — Chofer

Al marcar la casilla de consentimiento en el formulario de alta, el postulante otorga su firma digital y autoriza a Hercom a tratar sus datos personales, de acuerdo con la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento.

Datos que autorizo entregar y tratar
- Identidad: DNI, nombres y apellidos, sexo y fecha de nacimiento (declarados por el postulante; Hercom los verifica con RENIEC).
- Documentos de conducción y laborales: brevete, fotos o PDF del documento, CUL y récord de conductor.
- Datos de contacto y de operación: correo, teléfono, zona de trabajo y, si corresponde, datos de cobro.

Finalidad
Evaluar mi postulación como chofer de remplazo, verificar identidad y documentos, crear y mantener el perfil si soy aceptado, prevenir fraude y cumplir obligaciones legales.

Conservación
Los datos se conservan mientras dure la evaluación, la relación con la plataforma y los plazos legales aplicables.

Declaración
Declaro que la información y los documentos que entrego son verdaderos y me corresponden. Entiendo que esta casilla equivale a mi firma digital de autorización y que, sin ella, Hercom no puede recibir ni evaluar mi solicitud.

Puedo ejercer mis derechos de acceso, rectificación, cancelación y oposición a través del soporte de la app.`,
};
