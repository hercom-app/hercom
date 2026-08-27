import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}: Chofer para Remplazo`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: "HERCOM - Chofer para Reemplazo",
    description: siteConfig.description,
    locale: "es",
    tags: [
      "chofer",
      "remplazo",
      "chofer para remplazo",
      "chofer para remplazo",
    ],
    siteName: "HERCOM",
  },
  keywords: [
    "chofer",
    "remplazo",
    "chofer para remplazo",
    "chofer para remplazo",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            {children}
            {/* <div className="fixed bottom-4 right-4 z-30">
              <Button
                isExternal
                isIconOnly
                as={Link}
                className="bg-[#53cf60] lg:hidden"
                href="https://api.whatsapp.com/send?phone=51937244089"
                radius="full"
              >
                <WhatsappIcon className="text-xl" id="1" />
              </Button>
              <Button
                isExternal
                as={Link}
                className="bg-[#53cf60] max-lg:hidden text-white font-semibold"
                href="https://api.whatsapp.com/send?phone=51937244089"
                radius="full"
                startContent={<WhatsappIcon className="text-xl" id="2" />}
              >
                Contáctanos
              </Button>
            </div> */}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
