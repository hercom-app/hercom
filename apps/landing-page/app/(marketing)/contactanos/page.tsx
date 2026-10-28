import { Metadata } from "next";

import { title } from "@/components/primitives";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contáctanos",
};

export default function Page() {
  return (
    <>
      <main className="relative flex min-h-screen w-full flex-col overflow-hidden bg-neutral-200 bg-[url(../assets/contactanos_background.png)] bg-cover bg-center pt-16 -mt-16 dark:bg-neutral-900 md:bg-[50%_20%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section relative z-[3] flex min-h-[calc(100svh-4rem)] flex-1 items-center justify-center">
          <h1
            className={title({
              class: "text-center font-bold text-balance",
              size: "lg",
            })}
          >
            Contáctanos
          </h1>
        </div>
      </main>
      <ContactForm />
    </>
  );
}
