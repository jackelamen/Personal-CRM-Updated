"use client";

/**
 * A single headline with its share drawn as an arc. The number is the value;
 * the ring is a secondary read, never the only one.
 */
export default function StatusRing({
  value,
  total,
  caption,
  tone = "accent",
}: {
  value: number;
  total: number;
  caption: string;
  tone?: "accent" | "danger";
}) {
  const size = 96;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = total === 0 ? 0 : Math.min(1, value / total);
  const color = tone === "danger" ? "var(--color-danger)" : "var(--color-accent)";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - share)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="tabular text-[1.6rem] font-semibold leading-none">{value}</span>
        </div>
      </div>
      <p className="mt-2 text-center text-[0.72rem] leading-tight text-fg-muted">{caption}</p>
    </div>
  );
}
