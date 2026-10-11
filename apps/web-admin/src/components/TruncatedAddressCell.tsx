type TruncatedAddressCellProps = {
  address: string;
  onPress: () => void;
  /** Accesibilidad: ej. "Ver origen completo" */
  ariaLabel: string;
};

/** Una línea con ellipsis; clic abre detalle. */
export function TruncatedAddressCell({
  address,
  onPress,
  ariaLabel,
}: TruncatedAddressCellProps) {
  const text = address.trim() !== "" ? address.trim() : "—";
  const isEmpty = address.trim() === "";

  if (isEmpty) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel}
      title={text}
      className="block max-w-[11rem] truncate text-left text-xs font-medium text-zinc-900 hover:text-hercom hover:underline sm:max-w-[14rem]"
    >
      {text}
    </button>
  );
}
