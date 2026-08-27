"use client";
import { Accordion, AccordionItem } from "@nextui-org/accordion";

export function Faqs() {
  const data = [
    {
      title: "¿Por qué utilizar la App HERCOM?",
      content:
        "Utilizar el servicio de Chofer para Remplazo, te permitirá olvidarte de multas, retención de tu brevete o de accidentes de tránsito. Olvídate de ser el amigo elegido y disfruta también de tus reuniones.",
    },
    {
      title:
        "¿Cuál es la seguridad que me ofrece el servicio de Chofer para Remplazo?",
      content:
        "Mitigamos los riesgos con nuestros servicios; riesgos como accidentes, atropellos, choques u otros escenarios que puedan atentar contra tu vida o de los demás. Evita terminar en la cárcel.",
    },
    {
      title: "¿La App HERCOM está activa las 24 horas del día?",
      content:
        "La app sí está disponible las 24 horas del día los 7 días de la semana. Solo tienes que bajar la App Hercom - Chofer para Remplazo en tu celular y estará totalmente disponible para ti, tu familia y tus amigos",
    },
    {
      title: "¿Cómo hago para afiliarme como Chofer para Remplazo?",
      content:
        "Solo tienes que bajar la App Hercom - Chofer para Remplazo en tu celular por Google Play Store o también por la App Store; ingresa tus datos al aplicativo y un ejecutivo se pondrá en contacto contigo de calificar con los requisitos. Es totalmente gratis.",
    },
    {
      title:
        "Si me gusta manejar y soy responsable ¿Puedo ser un Chofer para Remplazo?",
      content:
        "Claro que sí; nosotros deseamos contar con Choferes para Remplazo que les apasione su trabajo, sean responsables y quieran ser parte de la familia Hercom.",
    },
    {
      title: "¿Cuánto cuesta afiliarse a HERCOM?",
      content:
        "No cuesta nada el afiliarse como Chofer para Remplazo; tendrás que cumplir con todos los documentos que por seguridad permitirán armar tu expediente, tu código de Chofer y así garantizar un buen servicio al público en general.",
    },
    {
      title:
        "¿El servicio de Chofer para Remplazo es exclusivo para empresarios?",
      content:
        "El servicio de Chofer para Remplazo es para el público en general, olvídate de ser el amigo elegido y disfruta también de tus reuniones. Recuerda no complicarte la vida; antes de TOMAR el volante.",
    },
  ];

  return (
    <Accordion variant="bordered">
      {data.map((item, index) => (
        <AccordionItem
          key={index}
          aria-label={item.title}
          classNames={{
            title: "text-base",
            content: "text-small",
          }}
          title={item.title}
        >
          {item.content}
        </AccordionItem>
      ))}
    </Accordion>
  );
}
