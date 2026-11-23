"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/input";
import { useAction } from "convex/react";

import { submitCorporateQuote } from "@/lib/convexApi";
import { formatConvexError } from "@/lib/convexError";
import {
  PERU_DEPARTMENTS,
  PERU_DISTRICTS,
  listProvincesForDepartment,
} from "@proyecto/peru-locations";

type Place = {
  district: string;
  province: string;
  department: string;
};

const DEFAULT_ORIGIN: Place = { district: "Lima", province: "Lima", department: "Lima" };

const empty = {
  companyName: "",
  contactName: "",
  ruc: "",
  email: "",
  phone: "",
  serviceHours: "",
  detail: "",
};

const RUC_LENGTH = 11;
const PHONE_LENGTH = 9;
const MAX_DRIVERS = 50;

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const WEEKDAYS = ["l", "m", "x", "j", "v", "s", "d"];

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildPlaces(): Place[] {
  const places: Place[] = [];
  for (const department of PERU_DEPARTMENTS) {
    for (const province of listProvincesForDepartment(department)) {
      const districts = PERU_DISTRICTS[`${department}|${province}`];
      if (districts === undefined) {
        places.push({ district: province, province, department });
      } else {
        for (const district of districts) {
          places.push({ district, province, department });
        }
      }
    }
  }
  return places;
}

const PLACES = buildPlaces();

function searchPlaces(query: string): Place[] {
  const term = fold(query.trim());
  if (term === "") return PLACES.filter((place) => place.province === "Lima").slice(0, 8);
  const starts: Place[] = [];
  const contains: Place[] = [];
  const region: Place[] = [];
  for (const place of PLACES) {
    const district = fold(place.district);
    if (district.startsWith(term)) starts.push(place);
    else if (district.includes(term)) contains.push(place);
    else if (fold(`${place.province} ${place.department}`).includes(term)) region.push(place);
  }
  return [starts, contains, region].flatMap((group) => group.sort(byCapitalFirst)).slice(0, 8);
}

function byCapitalFirst(a: Place, b: Place): number {
  const rank = (place: Place) => (place.department === "Lima" || place.department === "Callao" ? 0 : 1);
  return rank(a) - rank(b);
}

function placeRegion(place: Place): string {
  return `${place.province} - ${place.department}`;
}

function samePlace(a: Place | null, b: Place | null): boolean {
  return (
    a !== null &&
    b !== null &&
    a.district === b.district &&
    a.province === b.province &&
    a.department === b.department
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const term = fold(query.trim());
  const index = term === "" ? -1 : fold(text).indexOf(term);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong className="font-semibold">{text.slice(index, index + term.length)}</strong>
      {text.slice(index + term.length)}
    </>
  );
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayIso(): string {
  const now = new Date();
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

function shortDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(".", "");
}

function rangeLabel(start: string, end: string): string {
  if (start === "") return "";
  if (end === "" || end === start) return shortDate(start);
  return `${shortDate(start)} - ${shortDate(end)}`;
}

function normalizeRuc(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, RUC_LENGTH);
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, PHONE_LENGTH);
}

function FieldShell({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative flex h-14 min-w-0 items-center gap-3 rounded-xl border bg-white px-3 transition-colors ${
        active ? "border-primary ring-1 ring-primary" : "border-default-300 hover:border-default-400"
      }`}
    >
      <span className="shrink-0 text-default-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium leading-none text-default-500">{label}</span>
        {children}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path d="M12 21s-6-5.3-6-10.5a6 6 0 1112 0C18 15.7 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path d="M5 21V4m0 0h11l-2 4 2 4H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.5c.8-3 3.3-4.8 6.5-4.8s5.7 1.8 6.5 4.8" strokeLinecap="round" />
    </svg>
  );
}

function PlaceField({
  label,
  icon,
  value,
  placeholder,
  onSelect,
}: {
  label: string;
  icon: ReactNode;
  value: Place | null;
  placeholder: string;
  onSelect: (place: Place) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = searchPlaces(query);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function pick(place: Place) {
    onSelect(place);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <FieldShell active={open} icon={icon} label={label}>
        <input
          aria-autocomplete="list"
          aria-expanded={open}
          aria-label={label}
          autoComplete="off"
          className="mt-1 w-full truncate bg-transparent text-sm text-foreground outline-none placeholder:text-default-400"
          placeholder={value === null ? placeholder : `${value.district}, ${value.province}`}
          role="combobox"
          value={open ? query : value === null ? "" : `${value.district}, ${value.province}`}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open || results.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              pick(results[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </FieldShell>
      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border border-default-200 bg-white shadow-xl sm:right-auto sm:w-80">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-default-500">No encontramos ese distrito.</p>
          ) : (
            <ul className="max-h-80 overflow-auto py-1" role="listbox">
              {results.map((place, index) => (
                <li key={`${place.department}|${place.province}|${place.district}`}>
                  <button
                    className={`block w-full px-4 py-3 text-left ${
                      index === active ? "bg-primary/10" : "hover:bg-default-100"
                    }`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      pick(place);
                    }}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className="block text-sm text-foreground">
                      <Highlight query={query} text={place.district} />
                    </span>
                    <span className="mt-0.5 block text-xs text-default-500">{placeRegion(place)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  start,
  end,
  hover,
  today,
  onPick,
  onHover,
}: {
  year: number;
  month: number;
  start: string;
  end: string;
  hover: string;
  today: string;
  onPick: (iso: string) => void;
  onHover: (iso: string) => void;
}) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, index) => isoDate(year, month, index + 1)),
  ];
  const rangeEnd = end !== "" ? end : hover !== "" && start !== "" && hover > start ? hover : "";

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <p className="text-lg font-semibold">{MONTHS[month]}</p>
        <p className="text-xs font-semibold text-default-500">{year}</p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="pb-1 text-xs text-default-400">
            {weekday}
          </span>
        ))}
        {cells.map((iso, index) => {
          if (iso === null) return <span key={`blank-${index}`} />;
          const past = iso < today;
          const edge = iso === start || iso === end;
          const inside = start !== "" && rangeEnd !== "" && iso > start && iso < rangeEnd;
          return (
            <button
              key={iso}
              className={`h-10 rounded-lg text-sm transition-colors sm:h-11 ${
                past
                  ? "cursor-not-allowed bg-default-100 text-default-300"
                  : edge
                    ? "bg-primary font-semibold text-white"
                    : inside
                      ? "bg-primary/15 text-primary"
                      : "bg-default-50 text-foreground hover:bg-primary/10"
              } ${iso === today && !edge ? "ring-1 ring-primary" : ""}`}
              disabled={past}
              type="button"
              onClick={() => onPick(iso)}
              onMouseEnter={() => onHover(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateRangeModal({
  initialStart,
  initialEnd,
  onClose,
  onApply,
}: {
  initialStart: string;
  initialEnd: string;
  onClose: () => void;
  onApply: (start: string, end: string) => void;
}) {
  const today = todayIso();
  const seed = initialStart !== "" ? initialStart : today;
  const [view, setView] = useState({
    year: Number(seed.slice(0, 4)),
    month: Number(seed.slice(5, 7)) - 1,
  });
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd === initialStart ? "" : initialEnd);
  const [hover, setHover] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const next = view.month === 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: view.month + 1 };
  const canGoBack =
    view.year > Number(today.slice(0, 4)) ||
    (view.year === Number(today.slice(0, 4)) && view.month > Number(today.slice(5, 7)) - 1);

  function pick(iso: string) {
    if (start === "" || end !== "") {
      setStart(iso);
      setEnd("");
    } else if (iso < start) {
      setStart(iso);
    } else if (iso === start) {
      setEnd("");
    } else {
      setEnd(iso);
    }
  }

  function shift(step: number) {
    setView((current) => {
      const month = current.month + step;
      if (month < 0) return { year: current.year - 1, month: 11 };
      if (month > 11) return { year: current.year + 1, month: 0 };
      return { year: current.year, month };
    });
  }

  const summary = start === "" ? "Elige uno o varios días" : rangeLabel(start, end);

  return (
    <div
      aria-modal
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <div className="flex flex-col gap-3 border-b border-default-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h3 className="text-lg font-bold">Selecciona las fechas del servicio</h3>
          <div className="flex h-11 items-center gap-2 rounded-xl border border-default-300 px-3 text-sm text-default-600 sm:min-w-72">
            <CalendarIcon />
            <span className={start === "" ? "text-default-400" : "text-foreground"}>{summary}</span>
          </div>
        </div>

        <div className="relative overflow-auto px-5 py-5 sm:px-12">
          <button
            aria-label="Mes anterior"
            className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-default-500 hover:bg-default-100 disabled:opacity-30 sm:grid"
            disabled={!canGoBack}
            type="button"
            onClick={() => shift(-1)}
          >
            ‹
          </button>
          <button
            aria-label="Mes siguiente"
            className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-default-500 hover:bg-default-100 sm:grid"
            type="button"
            onClick={() => shift(1)}
          >
            ›
          </button>
          <div className="mb-3 flex justify-between sm:hidden">
            <button
              className="rounded-full px-3 py-1.5 text-sm text-default-600 disabled:opacity-30"
              disabled={!canGoBack}
              type="button"
              onClick={() => shift(-1)}
            >
              ‹ Anterior
            </button>
            <button
              className="rounded-full px-3 py-1.5 text-sm text-default-600"
              type="button"
              onClick={() => shift(1)}
            >
              Siguiente ›
            </button>
          </div>
          <div className="grid gap-8 md:grid-cols-2" onMouseLeave={() => setHover("")}>
            <MonthGrid
              end={end}
              hover={hover}
              month={view.month}
              start={start}
              today={today}
              year={view.year}
              onHover={setHover}
              onPick={pick}
            />
            <div className="hidden md:block">
              <MonthGrid
                end={end}
                hover={hover}
                month={next.month}
                start={start}
                today={today}
                year={next.year}
                onHover={setHover}
                onPick={pick}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-default-200 px-5 py-4 sm:px-6">
          <button
            className="text-sm font-medium text-default-600 hover:text-foreground"
            type="button"
            onClick={() => {
              setStart("");
              setEnd("");
            }}
          >
            Limpiar
          </button>
          <Button
            color="primary"
            isDisabled={start === ""}
            radius="full"
            onPress={() => onApply(start, end === "" ? start : end)}
          >
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CorporateQuoteForm() {
  const submit = useAction(submitCorporateQuote);
  const detailsRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<Place | null>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<Place | null>(null);
  const [dates, setDates] = useState({ start: "", end: "" });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [drivers, setDrivers] = useState(1);
  const [step, setStep] = useState<"trip" | "details">("trip");
  const [values, setValues] = useState(empty);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"sent" | "saved" | null>(null);
  const [rucBlurred, setRucBlurred] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);

  const rucComplete = values.ruc.length === RUC_LENGTH;
  const phoneComplete = values.phone.length === PHONE_LENGTH;
  const rucFieldError =
    rucBlurred && !rucComplete
      ? values.ruc.length === 0
        ? "Ingresa el RUC de 11 dígitos."
        : "El RUC debe tener 11 dígitos."
      : undefined;
  const phoneFieldError =
    phoneBlurred && !phoneComplete
      ? values.phone.length === 0
        ? "Ingresa el teléfono de 9 dígitos."
        : "El teléfono debe tener 9 dígitos."
      : undefined;

  useEffect(() => {
    if (step === "details") {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  function setField(key: keyof typeof empty, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function tripError(): string {
    if (origin === null) return "Elige el distrito de origen.";
    if (destination === null) return "Elige el distrito de destino.";
    if (dates.start === "") return "Elige las fechas del servicio.";
    if (dates.start < todayIso()) return "La fecha de inicio debe ser de hoy en adelante.";
    return "";
  }

  function onContinue() {
    const message = tripError();
    setError(message);
    if (message === "") setStep("details");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const trip = tripError();
    if (trip !== "" || origin === null || destination === null) {
      setError(trip);
      return;
    }
    if (!rucComplete) {
      setRucBlurred(true);
      setError("El RUC debe tener 11 dígitos.");
      return;
    }
    if (!phoneComplete) {
      setPhoneBlurred(true);
      setError("El teléfono debe tener 9 dígitos.");
      return;
    }
    const serviceHours = Number(values.serviceHours);
    if (!Number.isFinite(serviceHours) || serviceHours < 1) {
      setError("Indica las horas aproximadas del servicio.");
      return;
    }
    if (values.detail.trim() === "") {
      setError("Completa el detalle del viaje.");
      return;
    }

    setPending(true);
    try {
      const result = await submit({
        companyName: values.companyName,
        contactName: values.contactName,
        ruc: values.ruc,
        email: values.email,
        phone: values.phone,
        originDepartment: origin.department,
        originProvince: origin.province,
        originDistrict: origin.district,
        destinationDepartment: destination.department,
        destinationProvince: destination.province,
        destinationDistrict: destination.district,
        serviceStart: dates.start,
        serviceEnd: dates.end === "" ? dates.start : dates.end,
        serviceHours,
        driverCount: drivers,
        detail: values.detail,
      });
      setDone(result.emailSent ? "sent" : "saved");
      setValues(empty);
      setOrigin(DEFAULT_ORIGIN);
      setDestination(null);
      setDates({ start: "", end: "" });
      setDrivers(1);
      setStep("trip");
      setRucBlurred(false);
      setPhoneBlurred(false);
    } catch (cause) {
      setError(formatConvexError(cause, "No pudimos enviar la solicitud."));
    } finally {
      setPending(false);
    }
  }

  if (done !== null) {
    return (
      <div className="flex flex-col items-center gap-8 rounded-3xl bg-default-100 p-8 sm:flex-row sm:items-center lg:gap-12 lg:p-12">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">Recibimos tu solicitud</h2>
          <p className="mt-4 text-lg leading-relaxed text-default-600">
            {done === "sent"
              ? "Hemos enviado una confirmación de esta solicitud a tu correo. Un ejecutivo de HERCOM se pondrá en contacto contigo."
              : "Guardamos tu solicitud. El correo de confirmación no pudo salir en este momento. Un ejecutivo de HERCOM se pondrá en contacto contigo."}
          </p>
          <Button className="mt-8" color="primary" radius="full" onPress={() => setDone(null)}>
            Enviar otra solicitud
          </Button>
        </div>
        <Image
          alt=""
          className="h-auto w-full max-w-[280px] shrink-0 sm:max-w-[320px]"
          height={500}
          src="/solicitud-recibida.svg"
          width={500}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-3xl border border-default-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_auto]">
          <PlaceField
            icon={<PinIcon />}
            label="Desde"
            placeholder="Ingresa distrito"
            value={origin}
            onSelect={setOrigin}
          />
          <PlaceField
            icon={<FlagIcon />}
            label="Hacia"
            placeholder="Ingresa distrito"
            value={destination}
            onSelect={(place) => {
              setDestination(place);
              if (!samePlace(place, destination) || dates.start === "") setCalendarOpen(true);
            }}
          />
          <button className="min-w-0 text-left" type="button" onClick={() => setCalendarOpen(true)}>
            <FieldShell active={calendarOpen} icon={<CalendarIcon />} label="Fechas">
              <span
                className={`mt-1 block truncate text-sm ${
                  dates.start === "" ? "text-default-400" : "text-foreground"
                }`}
              >
                {dates.start === "" ? "Inicio - Fin" : rangeLabel(dates.start, dates.end)}
              </span>
            </FieldShell>
          </button>
          <FieldShell icon={<DriverIcon />} label="Choferes">
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="text-sm">
                {drivers} {drivers === 1 ? "chofer" : "choferes"}
              </span>
              <span className="flex items-center gap-1">
                <button
                  aria-label="Quitar un chofer"
                  className="grid h-7 w-7 place-items-center rounded-full border border-default-300 text-sm disabled:opacity-30"
                  disabled={drivers <= 1}
                  type="button"
                  onClick={() => setDrivers((count) => Math.max(1, count - 1))}
                >
                  −
                </button>
                <button
                  aria-label="Agregar un chofer"
                  className="grid h-7 w-7 place-items-center rounded-full border border-default-300 text-sm disabled:opacity-30"
                  disabled={drivers >= MAX_DRIVERS}
                  type="button"
                  onClick={() => setDrivers((count) => Math.min(MAX_DRIVERS, count + 1))}
                >
                  +
                </button>
              </span>
            </div>
          </FieldShell>
          <Button
            className="h-14 px-8 font-semibold md:col-span-2 xl:col-span-1"
            color="primary"
            radius="lg"
            type="button"
            onPress={onContinue}
          >
            Continuar
          </Button>
        </div>
        {step === "trip" && error !== "" && (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      {step === "details" && (
        <div
          ref={detailsRef}
          className="mt-6 scroll-mt-28 rounded-3xl border border-default-200 p-6 sm:p-8 lg:p-10"
        >
          <h3 className="text-xl font-bold tracking-tight">Datos de contacto</h3>
          <p className="mt-1 text-sm text-default-500">
            {origin?.district} → {destination?.district} · {rangeLabel(dates.start, dates.end)} ·{" "}
            {drivers} {drivers === 1 ? "chofer" : "choferes"}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8">
            <Input
              isRequired
              label="Nombre de contacto"
              labelPlacement="outside"
              placeholder="Quién coordina el viaje"
              value={values.contactName}
              onValueChange={(value) => setField("contactName", value)}
            />
            <Input
              label="Empresa"
              labelPlacement="outside"
              placeholder="Nombre de la empresa"
              value={values.companyName}
              onValueChange={(value) => setField("companyName", value)}
            />
            <Input
              isRequired
              description={
                values.ruc.length > 0 && !rucComplete && !rucBlurred
                  ? `${values.ruc.length}/${RUC_LENGTH} dígitos`
                  : undefined
              }
              errorMessage={rucFieldError}
              inputMode="numeric"
              isInvalid={rucFieldError !== undefined}
              label="RUC"
              labelPlacement="outside"
              maxLength={RUC_LENGTH}
              placeholder="11 dígitos"
              value={values.ruc}
              onBlur={() => setRucBlurred(true)}
              onValueChange={(value) => setField("ruc", normalizeRuc(value))}
            />
            <Input
              isRequired
              description={
                values.phone.length > 0 && !phoneComplete && !phoneBlurred
                  ? `${values.phone.length}/${PHONE_LENGTH} dígitos`
                  : undefined
              }
              errorMessage={phoneFieldError}
              inputMode="numeric"
              isInvalid={phoneFieldError !== undefined}
              label="Teléfono"
              labelPlacement="outside"
              maxLength={PHONE_LENGTH}
              placeholder="9 dígitos"
              value={values.phone}
              onBlur={() => setPhoneBlurred(true)}
              onValueChange={(value) => setField("phone", normalizePhone(value))}
            />
            <Input
              isRequired
              label="Correo"
              labelPlacement="outside"
              placeholder="correo@empresa.com"
              type="email"
              value={values.email}
              onValueChange={(value) => setField("email", value)}
            />
            <Input
              isRequired
              label="Horas aproximadas"
              labelPlacement="outside"
              min={1}
              placeholder="Ej. 8"
              step={1}
              type="number"
              value={values.serviceHours}
              onValueChange={(value) => setField("serviceHours", value)}
            />
            <Textarea
              isRequired
              className="sm:col-span-2"
              label="Detalle del viaje"
              labelPlacement="outside"
              minRows={4}
              placeholder="Lo que debamos saber del viaje"
              value={values.detail}
              onValueChange={(value) => setField("detail", value)}
            />
          </div>
          {error !== "" && (
            <p className="mt-6 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="mt-8 flex sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              color="primary"
              isDisabled={!rucComplete || !phoneComplete}
              isLoading={pending}
              radius="full"
              type="submit"
            >
              Solicitar cotización
            </Button>
          </div>
        </div>
      )}

      {calendarOpen && (
        <DateRangeModal
          initialEnd={dates.end}
          initialStart={dates.start}
          onApply={(start, end) => {
            setDates({ start, end });
            setCalendarOpen(false);
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </form>
  );
}
