"use client";

import { useId, useState } from "react";
import { monthKey, recentMonths } from "@/lib/format";
import type { Contact } from "@/lib/types";

/**
 * Times you reached out, by month. One series, so no legend is needed: the
 * title names it. Magnitude, so a single hue — height carries the value and
 * colour carries nothing.
 */
export default function ActivityChart({
  contacts,
  months = 6,
}: {
  contacts: Contact[];
  months?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();

  const buckets = recentMonths(months).map((m) => {
    const count = contacts.reduce(
      (total, contact) =>
        total + (contact.history ?? []).filter((d) => monthKey(d) === m.key).length,
      0,
    );
    return { ...m, count };
  });

  const peak = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <section className="card p-4" aria-labelledby={titleId}>
      <div className="flex items-baseline justify-between">
        <h2 id={titleId} className="label">
          Touchpoints · {months} months
        </h2>
        <p className="tabular text-[0.8rem] font-semibold">{total}</p>
      </div>

      <div className="mt-3 flex h-24 items-end gap-1.5">
        {buckets.map((bucket, index) => {
          const height = bucket.count === 0 ? 3 : (bucket.count / peak) * 100;
          const active = hover === index;
          return (
            <div
              key={bucket.key}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              {active ? (
                <span
                  role="tooltip"
                  className="absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-card-2 px-2 py-1 text-[0.7rem] shadow-lg"
                >
                  <span className="tabular font-semibold">{bucket.count}</span>{" "}
                  <span className="text-fg-muted">in {bucket.label}</span>
                </span>
              ) : null}
              {/* 4px rounded data-end, anchored to the baseline. */}
              <div
                style={{ height: `${height}%` }}
                className={`w-full rounded-t-[4px] transition-colors ${
                  bucket.count === 0
                    ? "bg-line"
                    : active
                      ? "bg-accent"
                      : "bg-accent-dim"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.key}
            className="flex-1 text-center text-[0.62rem] text-fg-faint"
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </section>
  );
}
