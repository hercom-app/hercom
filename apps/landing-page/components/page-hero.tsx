import Image, { StaticImageData } from "next/image";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  image: StaticImageData;
  imageAlt: string;
  imageClassName?: string;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  imageClassName,
  children,
}: PageHeroProps) {
  return (
    <section className="section grid items-center gap-10 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
      <div className="flex flex-col items-start">
        {eyebrow && (
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl xl:text-6xl">
          {title}
        </h1>
        {description && (
          <div className="mt-6 max-w-xl text-lg leading-relaxed text-default-600">
            {description}
          </div>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-default-100">
        <Image
          fill
          priority
          alt={imageAlt}
          className={cn("object-cover", imageClassName)}
          placeholder="blur"
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={image}
        />
      </div>
    </section>
  );
}
