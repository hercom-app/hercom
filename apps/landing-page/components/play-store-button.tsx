import { button as buttonStyles } from "@nextui-org/theme";

import { LogosGooglePlay } from "@/components/icons";

/** Visible, sin enlace: la ficha de HERCOM en Google Play aún no está publicada. */
export function PlayStoreButton() {
  return (
    <button
      disabled
      aria-disabled="true"
      className={buttonStyles({
        color: "primary",
        radius: "full",
        className:
          "bg-black text-white flex items-center gap-2 relative px-5 cursor-not-allowed",
      })}
      title="Próximamente en Google Play"
      type="button"
    >
      <LogosGooglePlay className="text-xl" />
      <span className="flex flex-col items-start">
        <span className="text-[10px] leading-none">Disponible en</span>
        <span className="font-semibold text-white">Google Play</span>
      </span>
    </button>
  );
}
