"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";

import {
  LEGAL_AUDIENCE_LABELS,
  LEGAL_DOCUMENTS,
  type LegalAudienceGroup,
  type LegalDocument,
  type LegalSection,
} from "@proyecto/legal";

function partitionByAudience(sections: LegalSection[]) {
  if (!sections.some((section) => section.group)) return null;

  const order: LegalAudienceGroup[] = ["cliente", "chofer"];
  const buckets = new Map<LegalAudienceGroup, LegalSection[]>();

  for (const section of sections) {
    const group = section.group ?? "cliente";
    const list = buckets.get(group) ?? [];
    list.push(section);
    buckets.set(group, list);
  }

  return order
    .filter((group) => buckets.has(group))
    .map((group) => ({
      group,
      label: LEGAL_AUDIENCE_LABELS[group],
      sections: buckets.get(group)!,
    }));
}

function SectionNavLink({
  activeId,
  section,
  onSelect,
}: {
  activeId: string;
  section: LegalSection;
  onSelect: (id: string) => void;
}) {
  return (
    <a
      className={
        activeId === section.id
          ? "block rounded-xl bg-primary px-3 py-2 text-sm font-semibold leading-snug text-white"
          : "block rounded-xl px-3 py-2 text-sm leading-snug text-default-600 hover:bg-background hover:text-primary"
      }
      href={`#${section.id}`}
      onClick={() => onSelect(section.id)}
    >
      {section.title}
    </a>
  );
}

function AudienceDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pb-1 pt-2">
      <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
        {label}
      </p>
      <div className="hidden h-px flex-1 bg-default-300/80 lg:block" />
    </div>
  );
}

function LegalSectionBody({ section }: { section: LegalSection }) {
  return (
    <section className="scroll-mt-28" id={section.id}>
      <h3 className="text-2xl font-bold tracking-tight">{section.title}</h3>
      <div className="mt-4 space-y-4 leading-relaxed text-default-600">
        {section.blocks.map((block, index) => {
          if (block.kind === "callout") {
            return (
              <p
                key={index}
                className="rounded-2xl bg-primary px-5 py-4 text-base font-semibold leading-relaxed text-white"
              >
                {block.text}
              </p>
            );
          }
          if (block.kind === "p") return <p key={index}>{block.text}</p>;
          return (
            <ul key={index} className="list-disc space-y-2 pl-5">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        })}
      </div>
    </section>
  );
}

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const [activeId, setActiveId] = useState(document.sections[0]?.id ?? "");
  const audienceBlocks = partitionByAudience(document.sections);

  useEffect(() => {
    const link = window.document.querySelector(
      `aside a[href="#${window.CSS.escape(activeId)}"]`,
    );
    const aside = link?.closest("aside");
    if (!(link instanceof HTMLElement) || !(aside instanceof HTMLElement)) return;
    const linkBox = link.getBoundingClientRect();
    const asideBox = aside.getBoundingClientRect();
    if (linkBox.top < asideBox.top || linkBox.bottom > asideBox.bottom) {
      aside.scrollTop +=
        linkBox.top - asideBox.top - aside.clientHeight / 2 + linkBox.height / 2;
    }
  }, [activeId]);

  useEffect(() => {
    const sections = document.sections
      .map((section) => window.document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null);
    if (sections.length === 0) return;

    const mark = () => {
      const line = 140;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
      }
      setActiveId(current);
    };

    mark();
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    return () => {
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
    };
  }, [document]);

  return (
    <section className="section py-10 lg:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        Legal
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        {document.title}
      </h1>
      <p className="mt-3 text-sm text-default-500">
        Última actualización: {document.updated}
      </p>
      <p className="mt-6 max-w-3xl text-lg leading-relaxed text-default-600">
        {document.lead}
      </p>

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="rounded-3xl bg-default-100 p-5 dark:bg-default-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-default-400">
              Documentos
            </p>
            <ul className="mt-3 space-y-1">
              {LEGAL_DOCUMENTS.map((item) => (
                <li key={item.slug}>
                  <NextLink
                    className={
                      item.slug === document.slug
                        ? "block rounded-xl bg-background px-3 py-2 text-sm font-semibold text-primary"
                        : "block rounded-xl px-3 py-2 text-sm text-default-600 hover:text-foreground"
                    }
                    href={item.path}
                  >
                    {item.navLabel}
                  </NextLink>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-default-400">
              En esta página
            </p>
            {audienceBlocks ? (
              <div className="mt-3 space-y-4">
                {audienceBlocks.map((block, blockIndex) => (
                  <div
                    key={block.group}
                    className={
                      blockIndex > 0
                        ? "border-t border-default-200 pt-4 dark:border-default-100"
                        : ""
                    }
                  >
                    <AudienceDivider label={block.label} />
                    <ul className="mt-2 space-y-0.5">
                      {block.sections.map((section) => (
                        <li key={section.id}>
                          <SectionNavLink
                            activeId={activeId}
                            onSelect={setActiveId}
                            section={section}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-3 space-y-1">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <SectionNavLink
                      activeId={activeId}
                      onSelect={setActiveId}
                      section={section}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <article className="min-w-0">
          {audienceBlocks ? (
            <div className="space-y-16">
              {audienceBlocks.map((block, blockIndex) => (
                <div
                  key={block.group}
                  className={
                    blockIndex > 0
                      ? "border-t border-default-200 pt-14 dark:border-default-100"
                      : ""
                  }
                >
                  <div className="rounded-2xl border border-default-200 bg-default-100 px-6 py-5 dark:border-default-100 dark:bg-default-50">
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">
                      {block.label}
                    </p>
                  </div>
                  <div className="mt-10 space-y-12">
                    {block.sections.map((section) => (
                      <LegalSectionBody key={section.id} section={section} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {document.sections.map((section) => (
                <LegalSectionBody key={section.id} section={section} />
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
