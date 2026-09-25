"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import ActivityChart from "@/components/ActivityChart";
import Hero from "@/components/Hero";
import PersonRow from "@/components/PersonRow";
import { Cake, Clock3, Download, Plus, Search, Users } from "lucide-react";
import { daysSince, daysUntil, daysUntilBirthday } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

type Scope = "overdue" | "week" | "unplanned" | "scheduled";

const TILES = [
  { href: "/people/new", label: "Add a contact", Icon: Plus, tone: "bg-accent text-accent-ink", hint: "New" },
  { href: "/people", label: "Browse everyone", Icon: Users, tone: "bg-card-2 text-accent", hint: "All" },
  { href: "/import", label: "Import & backup", Icon: Download, tone: "bg-card-2 text-accent", hint: "CSV" },
];

/** Contacted a long time ago, or never, with nothing on the calendar. */
const STALE_AFTER_DAYS = 90;

export default function TodayPage() {
  const { contacts, ready } = useStore();
  const [scope, setScope] = useState<Scope>("overdue");

  const buckets = useMemo(() => {
    const scheduled = contacts
      .filter((c) => c.nextFollowUp)
      .sort((a, b) => (daysUntil(a.nextFollowUp) ?? 0) - (daysUntil(b.nextFollowUp) ?? 0));

    /*
      The bucket that matters most for a freshly imported list: nothing is
      scheduled and no rhythm is set, so these people will never surface on
      their own no matter how long you leave them.
    */
    const unplanned = contacts
      .filter((c) => !c.nextFollowUp && !c.cadenceDays)
      .sort((a, b) => {
        const aSince = daysSince(a.lastContacted);
        const bSince = daysSince(b.lastContacted);
        // Never contacted first, then stalest.
        if (aSince === null && bSince === null) return a.name.localeCompare(b.name);
        if (aSince === null) return -1;
        if (bSince === null) return 1;
        return bSince - aSince;
      });

    const birthdays = contacts
      .map((c) => ({ contact: c, days: daysUntilBirthday(c.birthday) }))
      .filter((entry): entry is { contact: Contact; days: number } =>
        entry.days !== null && entry.days <= 30,
      )
      .sort((a, b) => a.days - b.days);

    return {
      overdue: scheduled.filter((c) => (daysUntil(c.nextFollowUp) ?? 1) <= 0),
      week: scheduled.filter((c) => (daysUntil(c.nextFollowUp) ?? 99) <= 7),
      unplanned,
      scheduled,
      birthdays,
      stale: contacts.filter((c) => {
        const since = daysSince(c.lastContacted);
        return !c.nextFollowUp && since !== null && since >= STALE_AFTER_DAYS;
      }),
    };
  }, [contacts]);

  if (!ready) return null;

  const list: Contact[] = buckets[scope];
  const SCOPES: { value: Scope; label: string; count: number }[] = [
    { value: "overdue", label: "Overdue", count: buckets.overdue.length },
    { value: "week", label: "Week", count: buckets.week.length },
    { value: "unplanned", label: "No plan", count: buckets.unplanned.length },
    { value: "scheduled", label: "Booked", count: buckets.scheduled.length },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  const emptyCopy: Record<Scope, string> = {
    overdue: "Nothing overdue. Nice.",
    week: "Nothing due this week.",
    unplanned: "Everyone has a follow-up or a rhythm. That is the goal.",
    scheduled: "Nothing scheduled yet. Set a rhythm on someone to start.",
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="appbar glass flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-caption font-medium text-fg-muted">{greeting}</p>
          <h1 className="truncate text-title font-bold leading-tight">Your people</h1>
        </div>
        <Link href="/people" aria-label="Search people" className="icon-circle">
          <Search size={18} strokeWidth={1.75} />
        </Link>
      </div>

      <div className="pane flex-1">
        <div className="mx-auto max-w-3xl space-y-3 p-4 pt-1">
          {contacts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="font-semibold">No contacts yet</p>
              <p className="mx-auto mt-1 max-w-xs text-callout text-fg-muted">
                Import a Google Contacts export, or add someone by hand.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/import" className="btn btn-primary">Import</Link>
                <Link href="/people/new" className="btn btn-quiet">Add contact</Link>
              </div>
            </div>
          ) : (
            <>
              <Hero
                contacts={contacts}
                dueThisWeek={buckets.week.length}
                overdue={buckets.overdue.length}
                unplanned={buckets.unplanned.length}
              />

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Overdue", value: buckets.overdue.length, Icon: Clock3 },
                  { label: "No plan", value: buckets.unplanned.length, Icon: Users },
                  { label: "Gone cold", value: buckets.stale.length, Icon: Clock3 },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="card flex flex-col items-center gap-1.5 p-3">
                    <span className="icon-chip bg-card-2 text-accent">
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <p className="text-caption text-fg-muted">{label}</p>
                    <p className="text-headline font-bold tabular">{value}</p>
                  </div>
                ))}
              </div>

              {buckets.birthdays.length > 0 ? (
                <section className="card overflow-hidden">
                  <h2 className="label flex items-center gap-1.5 p-3 pb-1.5">
                    <Cake size={14} strokeWidth={1.9} className="text-accent" />
                    Birthdays coming up
                  </h2>
                  <ul className="px-2 pb-2">
                    {buckets.birthdays.map(({ contact, days }) => (
                      <li key={contact.id}>
                        <Link href={`/people/${contact.id}`} className="row">
                          <Avatar contact={contact} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-body font-medium">
                            {contact.name}
                          </span>
                          <span className="chip">
                            {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days}d`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="card overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-3">
                  <h2 className="label shrink-0">Focus</h2>
                  <div className="segment min-w-0" role="tablist" aria-label="Filter people">
                    {SCOPES.map((s) => (
                      <button
                        key={s.value}
                        role="tab"
                        aria-selected={scope === s.value}
                        onClick={() => setScope(s.value)}
                      >
                        {s.label}
                        <span className="ml-1 tabular opacity-70">{s.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {list.length === 0 ? (
                  <p className="px-4 pb-6 pt-2 text-center text-callout text-fg-muted">
                    {emptyCopy[scope]}
                  </p>
                ) : (
                  <>
                    {scope === "unplanned" ? (
                      <p className="px-4 pb-2 text-caption text-fg-muted">
                        Nothing will surface these people on its own.{" "}
                        <Link href="/people?triage=1" className="text-accent underline-offset-2 hover:underline">
                          Set a rhythm in bulk
                        </Link>
                        .
                      </p>
                    ) : null}
                    <ul className="px-2 pb-2">
                      {list.slice(0, 25).map((contact) => (
                        <PersonRow key={contact.id} contact={contact} />
                      ))}
                    </ul>
                    {list.length > 25 ? (
                      <p className="px-4 pb-4 text-center text-caption text-fg-muted">
                        Showing 25 of {list.length}.{" "}
                        <Link href="/people" className="text-accent underline-offset-2 hover:underline">
                          See all in People
                        </Link>
                      </p>
                    ) : null}
                  </>
                )}
              </section>

              <ActivityChart contacts={contacts} />

              <div className="card divide-y divide-line overflow-hidden">
                {TILES.map(({ href, label, Icon, tone, hint }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex min-h-[var(--size-tap)] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-card-2"
                  >
                    <span className={`icon-chip ${tone}`}>
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span className="flex-1 text-body font-semibold">{label}</span>
                    <span className="chip">{hint}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
