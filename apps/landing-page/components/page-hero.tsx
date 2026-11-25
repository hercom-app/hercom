import Image, { StaticImageData } from "next/image";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const marketingHeroSectionClass =
  "section grid items-start gap-10 pb-12 pt-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-20 lg:pt-14";

export const marketingHeroTitleClass =
  "text-[2.75rem] font-bold leading-[1.04] tracking-tight text-balance sm:text-6xl xl:text-7xl";

export const marketingHeroImageClass =
  "relative aspect-[4/3] min-w-0 w-full overflow-hidden rounded-[2rem] bg-default-100";

type PageHeroProps = {
  title: ReactNode;
  description?: ReactNode;
  image: StaticImageData;
  imageAlt: string;
  imageClassName?: string;
  children?: ReactNode;
};

export function PageHero({
  title,
  description,
  image,
  imageAlt,
  imageClassName,
  children,
}: PageHeroProps) {
  return (
    <section className={marketingHeroSectionClass}>
      <div className="flex min-w-0 flex-col items-start">
        <h1 className={marketingHeroTitleClass}>{title}</h1>
        {description && (
          <div className="mt-6 max-w-lg text-lg leading-relaxed text-default-600">
            {description}
          </div>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <div className={marketingHeroImageClass}>
        <Image
          fill
          priority
          alt={imageAlt}
          className={cn(
            "object-cover",
            imageClassName ?? "object-[60%_40%]",
          )}
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={image}
        />
      </div>
    </section>
  );
}
