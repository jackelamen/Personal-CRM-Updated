"use client";

import Link from "next/link";
import { Flame, MoveRight } from "lucide-react";
import type { Contact } from "@/lib/types";
import { weeklyStreak } from "@/lib/format";

/**
 * The one gradient surface on the screen: what this week asks of you, how far
 * through it you are, and the streak that makes keeping it up feel worth it.
 */
export default function Hero({
  contacts,
  dueThisWeek,
  overdue,
}: {
  contacts: Contact[];
  dueThisWeek: number;
  overdue: number;
}) {
  const history = contacts.flatMap((c) => c.history ?? []);
  const streak = weeklyStreak(history);

  // Touchpoints logged since Sunday, against everything this week asked for.
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
  })();
  const doneThisWeek = history.filter((d) => d >= weekStart).length;
  const target = doneThisWeek + dueThisWeek;
  const share = target === 0 ? 1 : doneThisWeek / target;

  return (
    <section className="hero p-4">
      <p className="text-caption font-semibold text-white/75">This week</p>
      <h2 className="mt-0.5 text-title font-bold">
        {dueThisWeek === 0
          ? "Everyone is up to date"
          : `${dueThisWeek} ${dueThisWeek === 1 ? "person" : "people"} to reach out to`}
      </h2>

      <div className="track mt-4" role="img" aria-label={`${doneThisWeek} of ${target} done this week`}>
        <span style={{ width: `${Math.round(share * 100)}%` }} />
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-micro font-semibold text-white/70">Reached out</p>
          <p className="text-body font-bold tabular">
            {doneThisWeek}/{target}
          </p>
        </div>
        <div className="text-right">
          <p className="text-micro font-semibold text-white/70">Streak</p>
          <p className="flex items-center gap-1 text-body font-bold tabular">
            <Flame size={15} strokeWidth={2.2} />
            {streak} {streak === 1 ? "week" : "weeks"}
          </p>
        </div>
      </div>

      <Link
        href="/people?filter=due"
        className="btn mt-4 w-full border border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      >
        {overdue > 0 ? `Clear ${overdue} overdue` : "Review follow-ups"}
        <MoveRight size={16} strokeWidth={2.2} />
      </Link>
    </section>
  );
}
