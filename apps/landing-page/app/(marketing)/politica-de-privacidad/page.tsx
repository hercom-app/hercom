import { Metadata } from "next";

import { title } from "@/components/primitives";
import { PRIVACY_POLICY } from "@proyecto/legal";

export const metadata: Metadata = {
  title: PRIVACY_POLICY.title,
  description:
    "Cómo Hercom trata datos personales en su app de chofer de remplazo en Perú.",
};

export default function PoliticaDePrivacidadPage() {
  return (
    <main className="section py-10 lg:py-16 max-w-3xl">
      <h1
        className={title({
          size: "sm",
          class: "mb-8",
        })}
      >
        {PRIVACY_POLICY.title}
      </h1>
      <article className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line text-default-600 text-small lg:text-medium">
        {PRIVACY_POLICY.body}
      </article>
    </main>
  );
}