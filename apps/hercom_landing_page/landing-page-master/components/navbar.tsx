"use client";

import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import NextLink from "next/link";
import Image from "next/image";
import { Link } from "@nextui-org/link";
import clsx from "clsx";
import { useState } from "react";

import { FacebookIcon } from "./icons";

import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NextUINavbar
      classNames={{
        base: "bg-transparent",
      }}
      isMenuOpen={isOpen}
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-1 text-white dark:text-neutral-800"
            href="/"
          >
            <Image alt="logo" height={60} src="/logo.png" width={60} />
          </NextLink>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  // linkStyles({ color: "foreground" }),
                  "text-foreground font-semibold",
                  "data-[active=true]:text-primary data-[active=true]:font-medium active:text-primary-500 hover:text-primary-500 duration-300 hover:!opacity-100",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          {/* <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
            <XIcon className="text-default-500" />
          </Link>
          <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
            <InstagramIcon className="text-default-500" />
          </Link> */}
          <Link
            isExternal
            aria-label="Facebook"
            href={siteConfig.links.facbook}
          >
            <FacebookIcon className="text-foreground" size={20} />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {/* <Link isExternal aria-label="Twitter" href={siteConfig.links.twitter}>
          <XIcon className="text-default-500" />
        </Link>
        <Link isExternal aria-label="Discord" href={siteConfig.links.discord}>
          <InstagramIcon className="text-default-500" />
        </Link> */}
        <Link isExternal aria-label="Discord" href={siteConfig.links.facbook}>
          <FacebookIcon className="text-foreground" size={20} />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                className="w-full"
                color="foreground"
                href={item.href}
                size="lg"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
};
