import { Metadata } from "next";

import { title } from "@/components/primitives";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contáctanos",
};

export default function Page() {
  return (
    <>
      <main className="relative overflow-hidden bg-neutral-200 dark:bg-neutral-900 w-full min-h-screen -mt-16 pt-16 lg:min-h-[600px] lg:py-16 bg-[url(../assets/contactanos_background.png)] bg-cover bg-center md:bg-[50%_20%]">
        <div className="absolute z-[2] w-screen top-0 left-0 bg-gradient-to-b from-primary/75 to-transparent h-10" />
        <div className="absolute top-0 left-0 z-[1] bg-white/75 dark:bg-black/75 w-full h-full" />
        <div className="section h-full grid place-items-center relative z-[3]">
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
