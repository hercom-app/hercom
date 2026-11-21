import { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal-document";
import { PRIVACY_DOCUMENT } from "@proyecto/legal";

export const metadata: Metadata = {
  title: PRIVACY_DOCUMENT.title,
  description: PRIVACY_DOCUMENT.lead,
};

export default function PoliticaDePrivacidadPage() {
  return <LegalDocumentPage document={PRIVACY_DOCUMENT} />;
}
