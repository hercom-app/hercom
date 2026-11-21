import { Metadata } from "next";

import { CorporateQuoteForm } from "@/components/corporate-quote-form";
import { PageHero } from "@/components/page-hero";
import ContactanosImg from "@/assets/contactanos_background.png";

export const metadata: Metadata = {
  title: "Viajes corporativos",
  description:
    "Solicita una cotización de chofer para reemplazo para tu empresa. Te confirmamos por correo.",
};

export default function ViajesCorporativosPage() {
  return (
    <>
      <PageHero
        description="Cuéntanos el viaje de tu empresa. Guardamos la solicitud y te enviamos la confirmación al correo que indiques."
        eyebrow="Viajes corporativos"
        image={ContactanosImg}
        imageAlt="Ejecutiva de atención de HERCOM"
        imageClassName="object-[50%_30%]"
        title="Chofer para tu empresa"
      />
      <section className="section pb-16 lg:pb-24">
        <CorporateQuoteForm />
      </section>
    </>
  );
}
