// Maroc-Foot mark: red ball with the green interlaced star of the Moroccan flag.
// The "inverse" variant (white ball) is for red backgrounds such as the header.
const STAR = "50,19 68.2,75.1 20.5,40.4 79.5,40.4 31.8,75.1";

export function LogoMark({
  size = 40,
  inverse = false,
  className,
}: {
  size?: number;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={inverse ? "#fff" : "var(--brand-red)"} />
      <circle cx="50" cy="50" r="41" fill="none" stroke={inverse ? "var(--brand-red)" : "#fff"} strokeWidth="3" />
      <polygon points={STAR} fill="none" stroke="#fff" strokeWidth="11" strokeLinejoin="miter" />
      <polygon points={STAR} fill="none" stroke="var(--brand-green)" strokeWidth="6" strokeLinejoin="miter" />
    </svg>
  );
}
