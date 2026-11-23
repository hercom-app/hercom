import { useEffect, useMemo } from "react";
import { btnPrimaryClass, btnSecondaryClass } from "../lib/adminUi";

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

export function QuotePdfPreview({
  base64,
  filename,
  onClose,
}: {
  base64: string;
  filename: string;
  onClose: () => void;
}) {
  const url = useMemo(() => URL.createObjectURL(base64ToBlob(base64)), [base64]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del PDF"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-zinc-900">{filename}</p>
          <div className="flex gap-2">
            <a className={btnSecondaryClass} download={filename} href={url}>
              Descargar
            </a>
            <button type="button" className={btnPrimaryClass} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
        <iframe className="h-full w-full flex-1" src={url} title={filename} />
      </div>
    </div>
  );
}