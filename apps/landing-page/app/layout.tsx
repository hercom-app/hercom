import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name}: Chofer para Remplazo`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: "HERCOM - Chofer para Remplazo",
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
  themeColor: "#0266F2",
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
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "light",
            forcedTheme: "light",
          }}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
