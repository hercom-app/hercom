import { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { ContactForm } from "@/components/contact-form";
import ContactanosImg from "@/assets/contactanos_background.png";

export const metadata: Metadata = {
  title: "Contáctanos",
};

export default function Page() {
  return (
    <>
      <PageHero
        description={
          <p>
            Escríbenos para pedir un servicio o para ser parte de nuestro
            equipo de Choferes para Remplazo.
          </p>
        }
        eyebrow="Contáctanos"
        image={ContactanosImg}
        imageAlt="Ejecutiva de atención de HERCOM"
        imageClassName="object-[50%_30%]"
        title="Estamos para ayudarte"
      />
      <ContactForm />
    </>
  );
}
