import type { FC } from "react";
import { Link } from "@nextui-org/link";
import { HERCOM_SOCIAL_ITEMS, type HercomSocialKey } from "@proyecto/brand";

import { FacebookIcon, InstagramIcon, TikTokIcon } from "./icons";

const ICONS: Record<
  HercomSocialKey,
  FC<{ className?: string; size?: number }>
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
};

type SocialLinksProps = {
  className?: string;
  iconClassName?: string;
  iconSize?: number;
};

export function SocialLinks({
  className = "flex flex-row items-center gap-3",
  iconClassName = "text-white",
  iconSize = 20,
}: SocialLinksProps) {
  return (
    <div className={className}>
      {HERCOM_SOCIAL_ITEMS.map((item) => {
        const Icon = ICONS[item.key];
        return (
          <Link
            key={item.key}
            isExternal
            aria-label={item.label}
            href={item.url}
          >
            <Icon className={iconClassName} size={iconSize} />
          </Link>
        );
      })}
    </div>
  );
}