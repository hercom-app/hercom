import { LogosApple, LogosGooglePlay } from "@/components/icons";
import { cn } from "@/lib/utils";

const badgeClass =
  "flex items-center gap-2.5 rounded-xl bg-black px-4 py-2 text-white transition-opacity hover:opacity-85";

export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        className={badgeClass}
        href="https://play.google.com/store/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <LogosGooglePlay className="text-xl" />
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[10px] text-white/70">Disponible en</span>
          <span className="text-sm font-semibold">Google Play</span>
        </span>
      </a>
      <a
        className={badgeClass}
        href="https://www.apple.com/la/app-store/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <LogosApple className="text-xl text-white" />
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[10px] text-white/70">Descárgalo en el</span>
          <span className="text-sm font-semibold">App Store</span>
        </span>
      </a>
    </div>
  );
}
