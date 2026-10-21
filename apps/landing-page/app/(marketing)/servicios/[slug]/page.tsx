import { Metadata } from "next";
import { notFound } from "next/navigation";

import { DriverServiceView } from "@/components/driver-service-view";
import { driverServices, getDriverService } from "@/lib/driverServices";

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return driverServices.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = getDriverService(params.slug);

  if (!service) {
    return { title: "Servicio" };
  }

  return {
    title: service.title,
    description: service.lead,
  };
}

export default function DriverServicePage({ params }: PageProps) {
  const service = getDriverService(params.slug);

  if (!service) {
    notFound();
  }

  return <DriverServiceView service={service} />;
}
