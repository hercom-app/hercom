import { HERCOM_SOCIAL } from "@proyecto/brand";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "HERCOM",
  description: "Descripcion de la App HERCOM",
  navItems: [
    {
      label: "Inicio",
      href: "/",
    },
    {
      label: "Viajes corporativos",
      href: "/viajes-corporativos",
    },
    {
      label: "Nosotros",
      href: "/nosotros",
    },
    {
      label: "Servicios",
      href: "/servicios",
    },
    {
      label: "Cuidando vidas",
      href: "/cuidando-vidas",
    },
    {
      label: "Contáctanos",
      href: "/contactanos",
    },
  ],
  navMenuItems: [
    {
      label: "Inicio",
      href: "/",
    },
    {
      label: "Viajes corporativos",
      href: "/viajes-corporativos",
    },
    {
      label: "Nosotros",
      href: "/nosotros",
    },
    {
      label: "Servicios",
      href: "/servicios",
    },
    {
      label: "Cuidando vidas",
      href: "/cuidando-vidas",
    },
    {
      label: "Contáctanos",
      href: "/contactanos",
    },
  ],
  links: {
    ...HERCOM_SOCIAL,
    /** @deprecated usar `facebook` */
    facbook: HERCOM_SOCIAL.facebook,
  },
};
