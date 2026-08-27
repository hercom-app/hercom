"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { LogosGooglePlay, LogosApple, FacebookIcon } from "./icons";

import Logo from "@/assets/logo_inverted.png";
import { siteConfig } from "@/config/site";

export const Footer = () => {
  const path = usePathname();

  return (
    <footer className="w-full py-5 bg-primary">
      <div className="section grid grid-cols-1 gap-5 lg:grid-cols-4 lg:grid-rows-4">
        <div className="col-span-1 flex items-center justify-center lg:col-span-2 lg:justify-start">
          <Image alt="logo" height={100} src={Logo} width={100} />
        </div>
        {path !== "/" && (
          <div className="col-span-1 flex items-center justify-center gap-2 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:justify-start">
            <Link
              isExternal
              className={buttonStyles({
                color: "primary",
                radius: "full",
                className: "bg-black flex items-center gap-2 relative px-5",
              })}
              href="https://play.google.com/store/"
            >
              <LogosGooglePlay className="text-xl" />
              <div className="flex flex-col ">
                <span className="top-0 text-[10px] leading-none">
                  Disponible en
                </span>
                <span className="font-semibold text-white">Google Play</span>
              </div>
            </Link>
            <Link
              isExternal
              className={buttonStyles({
                color: "primary",
                radius: "full",
                className: "bg-black flex items-center gap-2 relative px-5",
              })}
              href="https://www.apple.com/la/app-store/"
            >
              <LogosApple className="text-xl text-white" />
              <div className="flex flex-col ">
                <span className="top-0 text-[10px] leading-none">
                  Descargalo en el
                </span>
                <span className="font-semibold text-white">App Store</span>
              </div>
            </Link>
          </div>
        )}
        <div className="col-span-1 flex flex-col items-center gap-2 lg:col-span-2 lg:col-start-1 lg:row-start-3 lg:items-start">
          <p className="text-white font-semibold">Siguenos en:</p>
          <Link
            isExternal
            aria-label="Facebook"
            href={siteConfig.links.facbook}
          >
            <FacebookIcon className="text-white" size={20} />
          </Link>
        </div>
        <div className="col-span-1 flex flex-col items-center gap-2 lg:row-span-3 lg:col-start-3 lg:items-start">
          <p className="text-white font-semibold">Ciudades:</p>
          <p className="flex flex-wrap text-white gap-2 justify-center lg:flex-nowrap lg:flex-col lg:gap-0">
            {[
              "Arequipa",
              "Callao",
              "Chiclayo",
              "Chincha",
              "Cusco",
              "Huacho",
              "Huancayo",
              "Ica",
              "Lima",
              "Pisco",
              "Piura",
              "Trujillo",
            ].map((s, i) => (
              <span key={`mobile-city-${i}`} className="lg:text-sm">
                {s}
              </span>
            ))}
          </p>
        </div>
        <div className="col-span-1 flex flex-col items-center gap-2 lg:row-span-3 lg:col-start-4 lg:items-start">
          <p className="text-white font-semibold">Menú</p>
          <div className="flex flex-wrap text-white gap-2 justify-center lg:flex-nowrap lg:flex-col">
            {siteConfig.navItems.map((s, i) => (
              <Link
                key={`mobile-link-${i}`}
                className="text-white"
                href={s.href}
              >
                {s.label}
              </Link>
            ))}
            <Link
              isExternal
              className="text-white"
              href="https://superb-ram-273.convex.cloud/api/storage/87b89bc9-3df1-45b1-bc4f-14d0a940abd0"
            >
              Política de privacidad
            </Link>
          </div>
        </div>

        <div className="col-span-full flex items-center gap-1 justify-center lg:row-start-4">
          <span className="text-white">Con el respaldo de</span>
          <p className="text-white font-bold">Ricardos & Más S.A.C.</p>
        </div>
      </div>
    </footer>
    // <footer className="w-full flex items-center justify-center py-3 bg-primary flex-col gap-5">
    //   <div className="flex flex-col items-center lg:flex-row lg:gap-3">
    //     {siteConfig.navItems.map((item, idx) => (
    //       <Link key={idx} className="text-white" href={item.href}>
    //         {item.label}
    //       </Link>
    //     ))}
    //     <Link
    //       isExternal
    //       className="text-white"
    //       href="https://superb-ram-273.convex.cloud/api/storage/87b89bc9-3df1-45b1-bc4f-14d0a940abd0"
    //     >
    //       Política de privacidad
    //     </Link>
    //   </div>
    //   <div className="flex items-center gap-1 text-current">
    //     <span className="text-white">Con el respaldo de</span>
    //     <p className="text-white font-bold">Ricardos & Más S.A.C.</p>
    //   </div>
    // </footer>
  );
};
