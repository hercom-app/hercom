/** Textos legales de HERCOM — Chofer para Remplazo (Perú). */

export const LEGAL_UPDATED = "20 de noviembre de 2026";

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "callout"; text: string };

export type LegalAudienceGroup = "cliente" | "chofer";

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
  /** Bloques PARA CLIENTE / PARA CHOFER en términos unificados */
  group?: LegalAudienceGroup;
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
  lead: "HERCOM y su servicio de Chofer para Remplazo se caracteriza por trasladar a los USUARIOS desde el inicio hasta el final de un viaje por la que fue solicitado un chofer en el confort de su propio vehículo o camioneta.",
  sections: [
    {
      id: "mision-vision",
      title: "1. Misión y visión",
      blocks: [
        {
          kind: "p",
          text: "HERCOM y su servicio de Chofer para Remplazo se caracteriza por trasladar a los USUARIOS desde el inicio hasta el final de un viaje por la que fue solicitado un chofer en el confort de su propio vehículo o camioneta.",
        },
        {
          kind: "p",
          text: "Nuestra misión es mitigar los riesgos ocasionados por los accidentes de tránsito y de sus consecuencias legales.",
        },
        {
          kind: "p",
          text: "Nuestra visión es poder profesionalizar el servicio de Choferes; ofreciendo calidad y confianza en el traslado desde la comodidad de su propio vehículo.",
        },
      ],
    },
    {
      id: "servicios-app",
      title: "2. Servicios de la App",
      blocks: [
        {
          kind: "p",
          text: "HERCOM - Choferes para Remplazo, es una app que nos permite articular el servicio de conducción vehicular entre el usuario y un chofer disponible para el buen traslado a su hogar o a su destino final requerido en su servicio solicitado.",
        },
        {
          kind: "p",
          text: "Es importante considerar que todos los choferes son registrados en una base de datos, la cual su información es corroborada y verificada por nuestro socio estratégico el estudio WHARON & ASOCIADOS, como también nuestros PARNERTS NACIONALES O PARNERTS INTERNACIOONALES de ser el caso; adicionalmente toda la información de los choferes se mantiene en constante actualización.",
        },
        {
          kind: "p",
          text: "Los choferes son monitoreados, capacitados y evaluados por nuestro socio estratégico WHARON & ASOCIADOS, PARNERTS NACIONALES O PARNERTS INTERNACIOONALES, en determinadas fechas u operaciones a realizar.",
        },
      ],
    },
    {
      id: "inscripcion",
      title: "3. Sobre su inscripción",
      blocks: [
        {
          kind: "p",
          text: "Toda persona que desee obtener el servicio de HERCOM, podrá descargar desde su dispositivo móvil y proceder a llenar toda la información necesaria para su inscripción. De ingresar y cumplir con todos los requisitos Ud. podrá iniciar a generar requerimientos de traslado a su destino final o de requerir otros servicios para choferes en otros canales comerciales.",
        },
        {
          kind: "p",
          text: "Otras fuentes de ingreso: www.hercom.pe",
        },
      ],
    },
    {
      id: "politicas",
      title: "4. Normas y políticas de uso",
      blocks: [
        {
          kind: "p",
          text: "Todo usuario, antes de requerir los servicios de la App HERCOM - Chofer para remplazo, deben de conocer las siguientes normas o políticas que les garantice viajar a su destino en la comodidad de su vehículo.",
        },
        {
          kind: "p",
          text: "Con nuestro lema: “Cuidamos de ti y de tu familia”, es un compromiso con nuestra familia y nuestra sociedad por lo cual fue creada la app Hercom – Chofer para Remplazo.",
        },
        {
          kind: "list",
          items: [
            "Al generar un requerimiento de Chofer para Remplazo, se compromete a brindar todas las facilidades técnicas de su vehículo requeridas por el chofer para iniciar el recorrido del servicio solicitado.",
            "Todos nuestros usuarios son bienvenidos al servicio de la App HERCOM - CHOFER PARA REMPLAZO.",
            "Confirmar la notificación enviada por el Chofer a su número de celular de donde genero el requerimiento del servicio, 05 minutos antes de llegar a la dirección solicitada.",
            "Al solicitar un servicio por la App HERCOM - Chofer para remplazo o cualquiera de nuestros canales de venta; Ud. deberá de cumplir con nuestras políticas.",
            "El 25% de adelanto del acuerdo realizado con el chofer por el servicio en la app lo hace responsable de un horario agendado, de un servicio programado y de mantener un cordial apoyo para que el chofer pueda rápidamente tomar el control de su vehículo.",
            "Contar con toda la documentación en regla de EL VEHÍCULO O CAMIONETA de acuerdo al Reglamento de Tránsito y de cualquier otra normativa que sea aplicable, según determinen las autoridades competentes. En caso de que el vehículo o camioneta no cumpla con las condiciones y nivel de servicio, independientemente de la situación y que ésta sea imputable a el Chofer para remplazo se entenderá como un incumplimiento por lo que se procederá conforme a lo establecido en las Políticas de Hercom o considerado como una cancelación del servicio, asumiendo los costos incurridos.",
            "El usuario debe tener conocimiento que el tiempo de espera es de máximo 05 minutos o en todo caso de algún retraso ponerse en contacto con el chofer que Ud. ya tiene conocimiento de su llegada al punto de partida del servicio.",
            "El Chofer para remplazo no tienen la obligación de realizar: compras de gasolina, cambio de llantas, buscar mecánicos por averías, u otras tareas que no son parte del servicio solicitado. Salvo acuerdo que uno de nuestros choferes pueda gestionar.",
            "Serán por cuenta del usuario los gastos que se originen por concepto de mantenimiento preventivo, seguros, peajes, combustible, contar con un celular con datos móviles suficientes para el uso de la plataforma de Hercom.",
            "Al entregar sus llaves del vehículo o camioneta; el Chofer para Remplazo, realizará una revisión externa del vehículo, indicando en el Checklist si hay choques, abolladuras o rayanos en la pintura de su vehículo. Luego se procederá con la maletera a revisar su llanta de repuesto, gatas, llaves o herramientas, las cuales se indicará en el Checklist.",
            "De ser el caso, si tuviera choques, abolladuras o rayones en la pintura de su vehículo informarlo; ya que se procederá con la toma de fotografías o realizar un video por los cuatro lados liberando de responsabilidad al chofer por actos anteriores que se pudieran ocasionar.",
            "Si dejará algún objeto dentro de su vehículo: MENCIONARLO, para que sea considerado en el inventario del Checklist. Sugerimos no tener objetos de valor, sustancias o mercaderías ilícitas que ocasionen problemas con las autoridades; de no informarlo, el usuario solicitante se hará responsable de todos los cargos sustentándolo ante las autoridades competentes.",
            "Si desea prolongar el servicio requerido de Chofer para remplazo, en su mismo aplicativo podrá ampliar las horas requeridas. De no hacerlo en la App, no se considera como un servicio ADICIONAL, perdiendo todo tipo de seguridad y confianza por el servicio.",
            "Al finalizar el servicio, se procederá a realizar una calificación, colocando el puntaje, se le enviará un mensaje de calificación por el servicio recibido.",
            "El Chofer para remplazo, una vez instalado en su vehículo o camioneta, están prohibidos de bajarse a realizar cualquier tipo de compras. Si lo realizará estarían cometiendo una falta grave en su servicio.",
            "Si hubiera una falta grave o acciones indecorosas en el recorrido del servicio, el chofer le comunicará al usuario de manera preventiva dicha falta; si continúa y hace caso omiso a la recomendación del chofer, se le indicará de manera preventiva una segunda vez su falta; procediendo a un tercer anuncio donde se procede a estacionar el vehículo en el carril derecho inmediato y se cancelará el servicio; sin poder realizar ni un tipo de reclamo por la cancelación del mismo. Todos los gastos incurridos por el servicio truncado, por malas prácticas del usuario deberán ser reconocidas en un tiempo máximo de 24 horas o se procederá a las acciones légales pertinentes.",
            "En caso de una emergencia médica, nuestra app estará programada para iniciar el protocolo de llevar al cliente al centro médico más cercano.",
            "Es recomendable por emergencias médicas, llenar los datos de uno o más números telefónicos de un familiar o de alguna persona de contacto como dato referencial al servicio para llamarlos.",
            "En caso de que Ud. haya ingerido bebidas alcohólicas, o se encuentre delicado de salud le recomendamos ser acompañado por un familiar o una persona de su confianza que firmará los diferentes protocolos del servicio. Si se encontrará solo, se procederá a una grabación con algún tipo de instrumento (celular o cámara) que garantice la ejecución y la conformidad del servicio.",
            "Señores usuarios, La App HERCOM - Chofer para remplazo son sus amigos elegidos para llevarlo a su casa, al trabajo o al destino final en la comodidad de su vehículo, NOSOTROS seguiremos trabajando para mitigar riesgo de tránsito y de las consecuencias legales por el bien de su vida y la vida de los demás, antes de tomar el volante.",
            "Todos los choferes serán respetuosos con Uds., solicitamos que Uds. nos den el mismo respeto para seguir trasladándolos a su destino final con bien.",
            "Hercom - Chofer para Remplazo; Por seguridad mantendremos toda la información en nuestra base de datos de clientes y choferes en estado confidencial. De ser el caso de un incidente, falta grave o algún tipo de delito cometido, los documentos de los choferes o usuarios serán entregados formalmente mediante un certificado de denuncia policial o de una denuncia judicial. Siendo responsables de la reglamentación de la ley de protección de datos personales y de la confidencialidad de los mismos.",
          ],
        },
      ],
    },
    {
      id: "pagos",
      title: "5. De los pagos por el servicio",
      blocks: [
        {
          kind: "p",
          text: "PRECIO. –  El precio de los servicios será el que se estipule en cada momento en nuestro sitio web y en la app, en el momento de realizar el contrato con el chofer, todos los montos son reflejados o están indicados en la divisa aplicable, incluyen tanto los posibles descuentos como los impuestos aplicables a la fecha del contrato.",
        },
        {
          kind: "p",
          text: "PAGO. –  El monto por el servicio realizado de cada Chofer es sugerido por la app; sin embargo, cada servicio podrá contar con algunas variaciones según condiciones o acuerdos realizados con el usuario final. Este monto podrá ser cobrado en efectivo o por trasferencia electrónica (yape, plin u otro tipo de pago electrónico que exista en el mercado). Como procedimiento de aceptación del servicio, el usuario abonará a la billetera digital o cuenta bancaria del chofer un 25% del costo del servicio en condición de adelanto. Siendo cancelada la diferencia el 75% al culminar el servicio solicitado.",
        },
        {
          kind: "p",
          text: "El pago del servicio por horas adicionales o de espera, como también de ser el caso de una movilidad de traslado para que le de el alcance el chofer al destino solicitante (taxi) deberá ser previa aprobación del cliente; Es importante contar con la calificación del servicio por el usuario en la app ya que nos permitirá garantizar un buen servicio.",
        },
        {
          kind: "p",
          text: "El costo de los servicios diurnos (6:00 am a 9:00pm) son considerados precios estándar del mercado; en los horarios nocturnos (10:00 pm a 5:00 am) podrán tener incrementos sugeridos por zonas, distancias u otras características que evalúe la app. En caso de los días festivos o feriados podrán tener modificaciones en el tarifário.",
        },
        {
          kind: "p",
          text: "La aceptación del servicio de chofer compromete a Ud. a cumplir con el pago de todos los gastos ocasionados y estipulados en las políticas mencionadas en este documento, expresamente cualquier vinculación económica que en el desarrollo del servicio se acuerde; el usuario actuará en nombre propio al asumir obligaciones o al adquirir el crédito.",
        },
      ],
    },
    {
      id: "cancelacion",
      title: "6. Políticas de cancelación del servicio",
      blocks: [
        {
          kind: "list",
          items: [
            "En servicios de Chofer para Remplazo:  Se aplicará el 25% del costo en caso de cancelación por penalidad o gastos operativos, después del tiempo máximo de espera del servicio sin haberlo cancelado en el tiempo máximo sugerido una vez solicitado (05 minutos).",
          ],
        },
        {
          kind: "p",
          text: "Esta política de cancelación se podrá ver afectada en los siguientes casos:",
        },
        {
          kind: "list",
          items: [
            "Durante eventos especiales en la ciudad los cuales afecten a la demanda general.",
            "Cuando el cliente tenga un comportamiento inadmisible para el desarrollo del servicio.",
            "Otros que afecten a la moral o al buen desarrollo del servicio del Chofer para Remplazo.",
          ],
        },
      ],
    },
    {
      id: "tiempos",
      title: "7. Tiempos del servicio",
      blocks: [
        {
          kind: "p",
          text: "El Servicio de Chofer para remplazo tiene un tiempo mínimo establecido de inicio y de fin de 02 horas; que es contabilizado desde la llegada del chofer al punto requerido hasta la llegada de su destino final. El pasajero podrá realizar recargas de horas adicionales del servicio en el mismo aplicativo con la finalidad de mantener la seguridad de su servicio. De no realizar la recarga en el aplicativo, el sistema caducará al tiempo establecido según políticas y se perderá todo tipo de reclamo ya que la app cuenta con un contador interno de tiempo para su auditoria. El tiempo de espera podrá ser máximo de 05 minutos, salvo coordinación con el Chofer responsable del servicio para ampliar la espera.",
        },
        {
          kind: "p",
          text: "Es importante cumplir con todas las obligaciones a su cargo de acuerdo con nuestras políticas del servicio para seguir trabajando en futuros viajes.",
        },
      ],
    },
  ],
};

export const DRIVER_TERMS_DOCUMENT: LegalDocument = {
  slug: "choferes",
  path: "/terminos-choferes",
  title: "Términos de uso para los choferes",
  navLabel: "Para choferes",
  updated: LEGAL_UPDATED,
  lead: "HERCOM y su servicio de Chofer para Remplazo se caracteriza por trasladar a los USUARIOS de inicio a fin de un viaje solicitado en el confort de su propio vehículo.",
  sections: [
    {
      id: "mision-vision",
      title: "1. Misión y visión",
      blocks: [
        {
          kind: "p",
          text: "HERCOM y su servicio de Chofer para Remplazo se caracteriza por trasladar a los USUARIOS de inicio a fin de un viaje solicitado en el confort de su propio vehículo.",
        },
        {
          kind: "p",
          text: "Nuestra misión es mitigar los riesgos ocasionados por los accidentes de tránsito y de sus consecuencias legales.",
        },
        {
          kind: "p",
          text: "Nuestra visión es poder profesionalizar el servicio de Choferes; ofreciendo calidad y confianza a nuestros usuarios trasladándolos a sus destinos desde la comodidad de su propio vehículo.",
        },
        {
          kind: "p",
          text: "Los servicios podrán visualizarse desde la opción del menú de la app lista. Lugar dónde podrán recibir y ofertar costos por cada servicio requerido por los usuarios. Los gastos adicionales como taxi, no podrán ser mayor al costo mínimo de nuestra tarifa básica de 02 horas.",
        },
      ],
    },
    {
      id: "servicios-app",
      title: "2. Servicios de la App",
      blocks: [
        {
          kind: "p",
          text: "HERCOM - Chofer para Remplazo, es una app que nos permite articular el servicio de conducción vehicular entre el usuario y un chofer disponible para el buen traslado a su destino final.",
        },
        {
          kind: "p",
          text: "Es importante considerar que todos los choferes son registrados en una base de datos por el estudio WHARTON & ASOCIADOS, la cual su información es corroborada y verificada por nuestros socios estratégicos, considerando que desde que todo chofer sea inscrito en la base de datos son responsables de vuestras obligaciones con el usuario final; adicionalmente toda la información de los choferes se mantiene en constante actualización.",
        },
        {
          kind: "p",
          text: "Los choferes son monitoreados, capacitados y evaluados por el estudio WHARTON & ASOCIADOS, PARNERTS LOCALES O PARTERTS INTERNACIONALES; en determinadas fechas u operaciones que vienen realizando. El profesionalismo de cada uno de Uds. Les permitirá nuevas opciones en las ofertas que realizará la empresa como: Choferes Seguros, Choferes de Flota, Choferes Corporativos, Choferes Premium. Cada una de las líneas de negocio antes mencionada tiene sus propias condiciones y reglas de trabajo que son administradas por el área comercial.",
        },
      ],
    },
    {
      id: "inscripcion",
      title: "3. Sobre la inscripción",
      blocks: [
        {
          kind: "p",
          text: "Toda persona que desee ser parte de HERCOM, podrá descargar la app y proceder a llenar todos los campos necesarios para su evaluación. De ingresar y cumplir con todos los requisitos Ud. podrá iniciar a generarse ingresos todos los días del año.",
        },
        {
          kind: "p",
          text: "Otras fuentes de ingreso: www.hercom.pe o al correo electrónico reclutamiento@ricardosymas.com",
        },
        {
          kind: "p",
          text: "Como Recibir más Servicios de Clientes:",
        },
        {
          kind: "p",
          text: "Para que Ud. comience a recibir servicios en la opción del menú lista, tendrá que deslizar el botón azul a color verde; una vez que descargue la app en su celular, deberá vincular su tarjeta de crédito o realizar la copra de MEMBRESIAS; los montos según tarifarios y ofertas que podría recibir lo podrá visualizarlo en su billetera digital. A Mayor pago, Ud. Podrá contar con mayores promociones o sorteos que se realizarán cada cierto tiempo.",
        },
        {
          kind: "p",
          text: "Con nuestro lema: “Cuidamos de ti y de tu familia”, es un compromiso con nuestra familia y nuestra sociedad por lo cual fue creada la app Hercom – Chofer para Remplazo.",
        },
      ],
    },
    {
      id: "politicas",
      title: "4. Normas y políticas del chofer",
      blocks: [
        {
          kind: "list",
          items: [
            "Todo Chofer para Remplazo tiene como responsabilidad valorar y cuidar la imagen de la empresa y de ofrecer un buen servicio a sus usuarios.",
            "Ser miembro del equipo de HERCOM – Chofer para Remplazo, es ser un integrante más de la familia empresarial, como también de la familia de quien solicita nuestros servicios.",
            "Ajustarse a las normas acordadas con respecto de la puntualidad y la dedicación con la que debe desempeñar todos LOS SERVICIOS.",
            "El 25% de adelanto del acuerdo realizado con el cliente por el servicio en la app lo hace responsable de un horario, de un servicio y de llevar al usuario amablemente a su destino solicitado.",
            "Siempre deberá de llenar sus formatos del Checklist antes de sus servicios; Recordar que el llenado del Checklist es obligatorio y de la conformidad del servicio del usuario para generar el pago en su cuenta bancaria o en su billetera digital.",
            "Por ningún motivo una vez instalado puede Ud. dejar la móvil estacionada en lugares prohibidos o diferentes al destino contratado.",
            "Considerando la naturaleza de los servicios, el lugar de trabajo será́ de la ruta comprendida de inicio a fin de lo requerido.",
            "Todo Chofer para Remplazo deberá conducir el vehículo respetando las señales de tránsito dentro del marco de la ley.",
            "Si   el   VEHÍCULO   destinado   al servicio objeto sufriera un daño ocasionado   por   culpa   o negligencia debidamente comprobada del Chofer para Remplazo, éste se obliga a cubrir el 100% de los gastos de reparación de los mismos; igualmente, en caso de manejar a exceso de velocidad, o bajo el efecto de algún estupefaciente, el Chofer para Remplazo se obliga a cubrir el 100% de los daños ocasionados al VEHÍCULO; en los casos que aplique, será el 100%del deducible.",
            "Está prohibido hablar o contestar el teléfono personal en horario de servicio. Caso de emergencia estacionarse y realizar la llamada telefónica previa comunicación al usuario que adquirió el servicio.",
            "Garantizar su higiene personal, como su vestimenta y sus valores al tomar contacto con cada uno de los usuarios que ha requerido un servicio. Todo los Choferes para Remplazo son calificados constantemente por el servicio realizado; pudiendo ser retirado de la base de datos de incumplir con dicha disposición. Se recomienda adquirir la compra de sus camisas, playeras u otros distintivos de servicios mínimo una vez a la semana. Consultar lugar de venta o concesionarios autorizados en la página web o en la misma app.",
            "Se encuentra prohibido conversar, escuchar o transmitir cualquier tipo de información personal, empresarial o del cliente en el vehículo. Nuestra misión es la máxima confidencialidad y concentración al volante.",
            "Prohibido ingerir bebidas alcohólicas en un plazo no menor de 48 horas anteriores al servicio. Si incumple con esta política será restringido de por vida de la base de datos de Choferes para Remplazo.",
            "Prohibido el consumo de drogas o estupefaciente alguno antes de un servicio, en el servicio o después del servicio. Se considera falta muy grave y será expulsado del equipo de choferes. Se realizarán pruebas o exámenes medico cada cierto tiempo sin comunicado alguno.",
            "Está prohibido tocar o mover cualquier tipo de objetos dentro del vehículo, salvo que el USUARIO le indique que se lo alcance; de preferencia estacionarse y que el propietario personalmente lo coja. Si en caso el chofer está solo en el vehículo, queda terminante prohibido tocar cualquier tipo de prenda u objeto. Se convierte en una falta muy grave donde será expulsado de la base de datos de por vida y se procederá a formalizar una denuncia penal en contra del chofer responsable.",
            "Por ineficiencia y/o falta de calidad en la prestación del servicio, comisión de actos fraudulentos o dolosos en nombre o contra HERCOM, será causal de retiro de la base de datos como Chofer para Remplazo.",
            "Si se encuentra solo en el vehículo, está prohibido fumar o encender la radio o cualquier tipo de objeto electrónico que genere distracción al conducir.",
            "En caso de una emergencia sanitaria del usuario (salud), dirigirse al centro médico más cercano y comunicarse con la central de riesgo en condición de muy urgente, para continuar con los protocolos de atención al cliente. La app Hercom cuenta con un botón de asistencia vía waze para dirigirlo a un hospital, clínica o centro medico mas cercano.",
            "El consumo de combustible, peajes u otros servicios, que acontecen en la ruta son asumidos por el propietario del vehículo. En caso de no tener dinero (caso extremo), será asumido por el chofer y rembolsado por Hercom previa verificación.",
            "En caso de falta indisciplinaría por parte del cliente, se tomará medidas preventivas que sustente dichos actos y comunicar a la central de riesgos para tomar acciones con el usuario solicitante.",
            "Por ni un motivo una vez recibido el vehículo deberá bajarse a realizar cualquier tipo de compras o encargos por el cliente. Chofer para Remplazo se caracteriza por conducir un vehículo de inicio al fin del servicio de manera segura.",
            "Es falta muy grave cambiar las rutas que indique la App. Los tiempos y las distancias son monitoreadas y calculadas por la App con un margen mínimo de error. De caso contrario se activará el botón de emergencia en coordinación con la PNP.",
            "Está prohibido ingerir cualquier tipo de comida o bebidas dentro del vehículo, considerado como una falta grave.",
            "Se recomienda conducir los vehículos a la defensiva, manteniendo el correcto reglamento de tránsito en lugares de alta concentración vehicular.",
            "Está prohibido solicitar o pedir trabajo al usuario como chofer o para algún familiar. Por ni un motivo se deberá entablar conversaciones generando incomodidad con el usuario; salvo sean propios del servicio como el Checklist.",
            "La acumulación de faltas graves o muy graves condicionarán al chofer a ser expulsado de la base de datos de la empresa y perdiendo todos sus derechos a reclamos.",
            "La App Hercom - Chofer para Remplazo, es un servicio libre de horarios que no genera responsabilidad alguna con la empresa.",
            "Hercom - Chofer para Remplazo; Por seguridad mantendremos toda la información en nuestra base de datos de clientes y choferes en estado confidencial. De ser el caso de un incidente, falta grave o algún tipo de delito cometido, los documentos de los choferes o usuarios serán entregados formalmente mediante un certificado de denuncia policial o de una denuncia judicial. Siendo respetuosos de la reglamentación de la ley de protección de datos personales y de la confidencialidad de los mismos.",
            "Mantenerse informado con las normas y políticas de tránsito impuestas por el MTC, garantizando un servicio profesional y de calidad.",
            "El chofer para Remplazo queda obligado a cumplir leal y correctamente con todos los deberes que le imponga este instrumento o aquellos que se deriven de las funciones y cargo, debiendo ejecutar las instrucciones que le confieran.",
            "Cualquiera otra prestación o beneficio, que no sean señalados, se entenderán conferidos a título personal del Chofer, por lo que en ningún caso constituirán una obligación para la empresa.",
          ],
        },
      ],
    },
    {
      id: "pagos",
      title: "5. De los pagos por el servicio",
      blocks: [
        {
          kind: "p",
          text: "El monto por el servicio realizado de cada Chofer es sugerido por la app; sin embargo, cada servicio podrá contar con algunas variaciones según condiciones o acuerdos realizados con el usuario final. Este monto podrá ser cobrado en efectivo o por trasferencia electrónica (yape, plin u otro tipo de pago electrónico que exista en el mercado). Como procedimiento de aceptación del servicio, el usuario abonará a la billetera digital o cuenta bancaria del chofer un 25% del costo total del servicio en condición de adelanto. Siendo completado la diferencia al culminar el servicio solicitado.",
        },
        {
          kind: "p",
          text: "El pago del servicio por horas adicionales o de espera, como también de ser el caso de una movilidad adquirida para el traslado del chofer al destino solicitante (taxi) deberá ser previa aprobación del cliente; Es importante contar con una buena calificación por el usuario en la app ya que nos permitirá garantizar un buen servicio realizado.",
        },
        {
          kind: "p",
          text: "El costo de los servicios diurnos (6:00 am a 9:00pm) son considerados precios estándar del mercado; en los horarios nocturnos (10:00 pm a 5:00 am) podrán tener incrementos sugeridos por zonas, distancias u otras características que evalúe la app. En caso de los días festivos o fferiados podrán tener modificaciones en el tarifario.",
        },
        {
          kind: "p",
          text: "Cabe recordarles que HERCOM – Chofer para Remplazo; desea profesionalizar a cada uno de Uds.; brindándoles capacitaciones, valores, atención al cliente y nuevas oportunidades de servicios que incrementarán sus ingresos. Lo único que se necesita es el compromiso de cuidar su puesto de trabajo y pensar en el bienestar de su familia.",
        },
      ],
    },
    {
      id: "cancelacion",
      title: "6. Políticas de cancelación del servicio",
      blocks: [
        {
          kind: "p",
          text: "En servicios de Chofer para Remplazo:  Se aplicará el 25% del costo en caso de cancelación por penalidad o gastos operativos, después del tiempo máximo de espera (05 minutos) que podrá cancelar o cambiar un servicio, los tiempos, agendas, disposición de los choferes están sujetos a los requerimientos programados por los usuarios solicitantes de las reservas programadas. No hay derecho de reclamos o devolución de dinero una vez que han obviado esta política de cancelación de servicios por el usuario solicitante.",
        },
        {
          kind: "p",
          text: "Esta política de cancelación se podrá ver afectada en los siguientes casos:",
        },
        {
          kind: "list",
          items: [
            "Durante eventos especiales en la ciudad los cuales afecten a la demanda general.",
            "Cuando el cliente tenga un comportamiento inadmisible para el desarrollo del servicio.",
            "Otros que afecten a la moral o al buen desarrollo del servicio del Chofer para Remplazo.",
          ],
        },
      ],
    },
    {
      id: "tiempos",
      title: "7. Tiempos del servicio",
      blocks: [
        {
          kind: "p",
          text: "El Servicio de Chofer para Remplazo tiene una duración mínima de 02 horas que es contabilizado desde la llegada del chofer a la dirección por lo que fue requerido hasta el destino final del servicio. El usuario podrá realizar recargas de horas adicionales en el mismo aplicativo con la finalidad de mantener la seguridad del servicio. De no realizar la recarga en el aplicativo nos veremos en la necesidad de culminar el servicio al haber agotado su tiempo del servicio.",
        },
        {
          kind: "p",
          text: "Señores Chóferes no deberán de aceptar propuestas de servicios extras que no sean administradas por la app; porque caerán en una falta muy grave a nuestras políticas y podrán ser expulsados de la base de datos como conductores.",
        },
        {
          kind: "p",
          text: "El tiempo de espera podrá ser un máximo de 05 minutos, salvo coordinación con el Usuario para que pueda realizar su recarga en la App.",
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

export const LEGAL_AUDIENCE_LABELS: Record<LegalAudienceGroup, string> = {
  cliente: "Para cliente",
  chofer: "Para chofer",
};

function buildAudienceSections(
  sections: LegalSection[],
  audience: LegalAudienceGroup,
  idPrefix: string,
): LegalSection[] {
  return sections.map((section, index) => ({
    ...section,
    id: `${idPrefix}-${section.id}`,
    group: audience,
    title: `${index + 1}. ${stripNumber(section.title)}`,
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
    ...buildAudienceSections(
      PASSENGER_TERMS_DOCUMENT.sections,
      "cliente",
      "cliente",
    ),
    ...buildAudienceSections(DRIVER_TERMS_DOCUMENT.sections, "chofer", "chofer"),
  ],
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
