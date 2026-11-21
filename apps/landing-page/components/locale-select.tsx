"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type LocaleSelectProps = {
  ariaLabel: string;
  options: Option[];
  value: string;
  icon?: ReactNode;
  variant: "solid" | "ghost";
};

function ChevronDown() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4 text-primary"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function LocaleSelect({
  ariaLabel,
  options,
  value,
  icon,
  variant,
}: LocaleSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-full text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
          variant === "solid"
            ? "bg-white px-4 text-neutral-900 hover:bg-white/90"
            : "px-2 text-white hover:bg-white/10",
        )}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon}
        {current?.label}
        <ChevronDown />
      </button>
      {open && (
        <ul
          aria-label={ariaLabel}
          className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-2xl bg-white p-1.5 text-neutral-900 shadow-xl ring-1 ring-black/5"
          role="listbox"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                aria-selected={option.value === value}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium hover:bg-neutral-100"
                role="option"
                type="button"
                onClick={() => setOpen(false)}
              >
                {option.label}
                {option.value === value && <CheckIcon />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
