"use client";

import Link from "next/link";
import { Flame, MoveRight } from "lucide-react";
import type { Contact } from "@/lib/types";
import { toInputDate, weeklyStreak } from "@/lib/format";

/**
 * The one gradient surface on the screen. It states the single truest thing
 * about the state of the list — which is not always flattering: a list where
 * nobody is scheduled is not "up to date", it is unmanaged, and saying so is
 * the whole point of the screen.
 */
export default function Hero({
  contacts,
  dueThisWeek,
  overdue,
  unplanned,
}: {
  contacts: Contact[];
  dueThisWeek: number;
  overdue: number;
  /** People with no follow-up and no rhythm — nothing will ever surface them. */
  unplanned: number;
}) {
  const history = contacts.flatMap((c) => c.history ?? []);
  const streak = weeklyStreak(history);

  // Touchpoints logged since Sunday, against everything this week asked for.
  const weekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return toInputDate(d);
  })();
  const doneThisWeek = history.filter((d) => d >= weekStart).length;
  const target = doneThisWeek + dueThisWeek;
  const share = target === 0 ? 1 : doneThisWeek / target;

  const headline =
    overdue > 0
      ? `${overdue} ${overdue === 1 ? "person is" : "people are"} overdue`
      : dueThisWeek > 0
        ? `${dueThisWeek} ${dueThisWeek === 1 ? "person" : "people"} to reach out to`
        : unplanned > 0
          ? `${unplanned} ${unplanned === 1 ? "person has" : "people have"} no plan`
          : "Everyone is up to date";

  const sub =
    overdue === 0 && dueThisWeek === 0 && unplanned > 0
      ? "Nothing is scheduled for them, so nothing will remind you."
      : null;

  return (
    <section className="hero p-4">
      <p className="text-caption font-semibold text-white/75">This week</p>
      <h2 className="mt-0.5 text-title font-bold">{headline}</h2>
      {sub ? <p className="mt-1 text-callout text-white/80">{sub}</p> : null}

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
        href={overdue === 0 && dueThisWeek === 0 && unplanned > 0 ? "/people?triage=1" : "/people"}
        className="btn mt-4 w-full border border-white/25 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
      >
        {overdue > 0
          ? `Clear ${overdue} overdue`
          : unplanned > 0 && dueThisWeek === 0
            ? "Set a rhythm for them"
            : "Review follow-ups"}
        <MoveRight size={16} strokeWidth={2.2} />
      </Link>
    </section>
  );
}
