import { Metadata } from "next";

import { CorporateQuoteForm } from "@/components/corporate-quote-form";
import { PageHero } from "@/components/page-hero";
import ClienteImg from "@/assets/cliente_background.png";

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
        image={ClienteImg}
        imageAlt="Clientes de HERCOM viajando en su vehículo"
        imageClassName="object-[45%_40%]"
        title="Chofer para tu empresa"
      />
      <section className="section pb-16 lg:pb-24">
        <CorporateQuoteForm />
      </section>
    </>
  );
}
