"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";

import { LEGAL_DOCUMENTS, type LegalDocument } from "@proyecto/legal";

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const [activeId, setActiveId] = useState(document.sections[0]?.id ?? "");

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

      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
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
            <ul className="mt-3 space-y-1">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <a
                    className={
                      activeId === section.id
                        ? "block rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                        : "block rounded-xl px-3 py-1.5 text-sm text-default-600 hover:text-primary"
                    }
                    href={`#${section.id}`}
                    onClick={() => setActiveId(section.id)}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="min-w-0 space-y-12">
          {document.sections.map((section) => (
            <section
              key={section.id}
              className="scroll-mt-28"
              id={section.id}
            >
              <h2 className="text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
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
          ))}
        </article>
      </div>
    </section>
  );
}
