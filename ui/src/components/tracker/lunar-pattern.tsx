export function MoonGlyph({
  illumination,
  waxing,
}: {
  illumination: number;
  waxing: boolean;
}) {
  const lit = Math.max(0.06, Math.min(0.94, illumination));
  const offset = waxing ? 18 - lit * 36 : lit * 36 - 18;
  return (
    <span className="moon-glyph" aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="22" className="moon-sky" />
        <circle cx="32" cy="32" r="20" className="moon-dark" />
        <circle cx={32 + offset} cy="32" r="20" className="moon-lit" />
      </svg>
    </span>
  );
}
