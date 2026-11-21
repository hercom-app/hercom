"use client";

import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import NextLink from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";

import { LocaleSelect } from "@/components/locale-select";
import { siteConfig } from "@/config/site";
import LogoWhite from "@/assets/logo_inverted.png";

const COUNTRIES = [{ value: "pe", label: "Perú" }];
const LANGUAGES = [{ value: "es", label: "Español" }];

function GlobeIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <NextUINavbar
      classNames={{
        base: "z-50 bg-primary text-white",
        wrapper: "px-6",
        toggle: "text-white",
      }}
      height="4.5rem"
      isBlurred={false}
      isMenuOpen={isOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsOpen}
    >
      <NavbarContent className="basis-1/5" justify="start">
        <NavbarBrand as="li" className="max-w-fit">
          <NextLink className="flex items-center" href="/">
            <Image
              priority
              alt="HERCOM"
              className="h-11 w-auto"
              src={LogoWhite}
            />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-1 lg:flex" justify="center">
        {siteConfig.navItems.map((item) => (
          <li key={item.href}>
            <NextLink
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={clsx(
                "rounded-full px-3.5 py-2 text-[15px] font-medium text-white transition-colors",
                isActive(pathname, item.href)
                  ? "bg-white/20"
                  : "hover:bg-white/10",
              )}
              href={item.href}
            >
              {item.label}
            </NextLink>
          </li>
        ))}
      </NavbarContent>

      <NavbarContent className="basis-1/5 gap-2" justify="end">
        <li className="hidden items-center gap-2 sm:flex">
          <LocaleSelect
            ariaLabel="País"
            options={COUNTRIES}
            value="pe"
            variant="solid"
          />
          <LocaleSelect
            ariaLabel="Idioma"
            icon={<GlobeIcon />}
            options={LANGUAGES}
            value="es"
            variant="ghost"
          />
        </li>
        <NavbarMenuToggle className="lg:hidden" />
      </NavbarContent>

      <NavbarMenu className="gap-1 pt-6">
        {siteConfig.navMenuItems.map((item) => (
          <NavbarMenuItem key={item.href}>
            <NextLink
              className={clsx(
                "block rounded-2xl px-4 py-3 text-lg font-medium",
                isActive(pathname, item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground",
              )}
              href={item.href}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </NextLink>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem className="mt-4 flex gap-6 border-t border-default-200 px-4 pt-5 text-default-600 sm:hidden">
          <span>
            País: <span className="font-semibold text-foreground">Perú</span>
          </span>
          <span>
            Idioma:{" "}
            <span className="font-semibold text-foreground">Español</span>
          </span>
        </NavbarMenuItem>
      </NavbarMenu>
    </NextUINavbar>
  );
};
