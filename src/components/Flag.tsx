// Round country flags drawn in SVG (no external images). Codes match
// `Competition.country`; England uses the St George cross, and the cups use
// region badges: EU (ring of gold stars) and AF (gold star on green).
const STAR = "50,19 68.2,75.1 20.5,40.4 79.5,40.4 31.8,75.1";

function Fill({ country }: { country: string }) {
  switch (country) {
    case "MA":
      return (
        <>
          <rect width="100" height="100" fill="#c1272d" />
          <polygon points={STAR} transform="translate(15 15) scale(.7)" fill="none" stroke="#006233" strokeWidth="8" />
        </>
      );
    case "GB":
      return (
        <>
          <rect width="100" height="100" fill="#fff" />
          <path d="M42 0h16v100H42zM0 42h100v16H0z" fill="#ce1124" />
        </>
      );
    case "ES":
      return (
        <>
          <rect width="100" height="100" fill="#aa151b" />
          <rect y="25" width="100" height="50" fill="#f1bf00" />
        </>
      );
    case "IT":
      return (
        <>
          <rect width="34" height="100" fill="#008c45" />
          <rect x="33" width="34" height="100" fill="#f4f5f0" />
          <rect x="66" width="34" height="100" fill="#cd212a" />
        </>
      );
    case "DE":
      return (
        <>
          <rect width="100" height="34" fill="#000" />
          <rect y="33" width="100" height="34" fill="#dd0000" />
          <rect y="66" width="100" height="34" fill="#ffce00" />
        </>
      );
    case "FR":
      return (
        <>
          <rect width="34" height="100" fill="#0055a4" />
          <rect x="33" width="34" height="100" fill="#fff" />
          <rect x="66" width="34" height="100" fill="#ef4135" />
        </>
      );
    case "EU":
      return (
        <>
          <rect width="100" height="100" fill="#003399" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={50 + 28 * Math.sin((i * Math.PI) / 6)} cy={50 - 28 * Math.cos((i * Math.PI) / 6)} r="5" fill="#ffcc00" />
          ))}
        </>
      );
    case "AF":
      return (
        <>
          <rect width="100" height="100" fill="#006233" />
          <polygon points={STAR} transform="translate(15 15) scale(.7)" fill="#f2c200" />
        </>
      );
    default:
      return <rect width="100" height="100" fill="#888" />;
  }
}

export function Flag({ country, size = 40 }: { country: string; size?: number }) {
  const id = `flag-${country}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <clipPath id={id}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <Fill country={country} />
      </g>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
