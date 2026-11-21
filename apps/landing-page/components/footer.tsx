import Image from "next/image";
import NextLink from "next/link";

import { SocialLinks } from "./social-links";
import { StoreBadges } from "./store-badges";

import Logo from "@/assets/logo_inverted.png";
import { siteConfig } from "@/config/site";

const columnTitle = "mb-4 text-sm font-semibold text-white";
const linkClass = "text-white/65 transition-colors hover:text-white";

export const Footer = () => {
  return (
    <footer className="bg-[#0a0f1f] text-white">
      <div className="section grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <div className="flex flex-col items-start gap-6 lg:col-span-5">
          <Image alt="HERCOM" height={64} src={Logo} width={64} />
          <p className="max-w-sm leading-relaxed text-white/65">
            Chofer para Remplazo. Manejamos tu vehículo para que tú y tu
            familia lleguen a casa sanos y salvos.
          </p>
          <StoreBadges />
        </div>

        <div className="lg:col-span-3">
          <p className={columnTitle}>Menú</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-1">
            {siteConfig.navItems.map((item) => (
              <li key={item.href}>
                <NextLink className={linkClass} href={item.href}>
                  {item.label}
                </NextLink>
              </li>
            ))}
            <li>
              <NextLink className={linkClass} href="/terminos-y-condiciones">
                Términos de uso
              </NextLink>
            </li>
            <li>
              <NextLink className={linkClass} href="/politica-de-privacidad">
                Política de privacidad
              </NextLink>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className={columnTitle}>Ciudades</p>
          <ul className="space-y-3 text-white/65">
            <li>Lima</li>
            <li>Callao</li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <p className={columnTitle}>Síguenos</p>
          <SocialLinks
            className="flex items-center gap-3"
            iconClassName="text-white"
            iconSize={22}
          />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section flex flex-col items-center justify-between gap-2 py-6 text-sm text-white/50 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. Todos los derechos
            reservados.
          </span>
          <span>
            Con el respaldo de{" "}
            <span className="font-semibold text-white/80">
              Ricardos &amp; Más S.A.C.
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
};
