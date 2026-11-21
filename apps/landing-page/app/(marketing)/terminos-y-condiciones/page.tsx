import { Metadata } from "next";

import { LegalDocumentPage } from "@/components/legal-document";
import { TERMS_DOCUMENT } from "@proyecto/legal";

export const metadata: Metadata = {
  title: TERMS_DOCUMENT.title,
  description: TERMS_DOCUMENT.lead,
};

export default function TerminosPage() {
  return <LegalDocumentPage document={TERMS_DOCUMENT} />;
}
