"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import ActivityChart from "@/components/ActivityChart";
import Hero from "@/components/Hero";
import { Bell, BookOpen, Check, Clock3, Download, Plus, Users } from "lucide-react";
import { daysUntil, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

type Scope = "overdue" | "week" | "all";

const TILES = [
  { href: "/people/new", label: "Add a contact", Icon: Plus, tone: "bg-accent text-accent-ink", hint: "New" },
  { href: "/people", label: "Browse everyone", Icon: Users, tone: "bg-card-2 text-accent", hint: "All" },
  { href: "/import", label: "Import & backup", Icon: Download, tone: "bg-card-2 text-accent", hint: "CSV" },
];

export default function TodayPage() {
  const { contacts, ready, logContact, snooze } = useStore();
  const [scope, setScope] = useState<Scope>("week");

  const buckets = useMemo(() => {
    const dated = contacts
      .filter((c) => c.nextFollowUp)
      .sort((a, b) => (daysUntil(a.nextFollowUp) ?? 0) - (daysUntil(b.nextFollowUp) ?? 0));
    return {
      overdue: dated.filter((c) => (daysUntil(c.nextFollowUp) ?? 1) <= 0),
      week: dated.filter((c) => (daysUntil(c.nextFollowUp) ?? 99) <= 7),
      all: dated,
    };
  }, [contacts]);

  if (!ready) return null;

  const list: Contact[] = buckets[scope];
  const SCOPES: { value: Scope; label: string; count: number }[] = [
    { value: "overdue", label: "Overdue", count: buckets.overdue.length },
    { value: "week", label: "Week", count: buckets.week.length },
    { value: "all", label: "All", count: buckets.all.length },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="appbar glass flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <p className="text-caption font-medium text-fg-muted">{greeting}</p>
          <h1 className="truncate text-title font-bold leading-tight">Your people</h1>
        </div>
        <Link href="/import" aria-label="Import and data" className="icon-circle">
          <Bell size={18} strokeWidth={1.75} />
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
              />

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Overdue", value: buckets.overdue.length, Icon: Clock3 },
                  { label: "This week", value: buckets.week.length, Icon: BookOpen },
                  { label: "People", value: contacts.length, Icon: Users },
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

              <ActivityChart contacts={contacts} />

              <section className="card overflow-hidden">
                <div className="flex items-center justify-between gap-2 p-3">
                  <h2 className="label">Follow-ups</h2>
                  <div className="segment" role="tablist" aria-label="Filter follow-ups">
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
                    {scope === "overdue" ? "Nothing overdue. Nice." : "Nothing scheduled here."}
                  </p>
                ) : (
                  <ul className="px-2 pb-2">
                    {list.map((contact) => {
                      const overdue = isOverdue(contact.nextFollowUp);
                      return (
                        <li key={contact.id} className="rounded-2xl p-1">
                          {/* The whole row is the target, not the name text. */}
                          <Link
                            href={`/people/${contact.id}`}
                            className="row"
                          >
                            <Avatar contact={contact} ring={overdue} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-body font-semibold leading-tight">
                                {contact.name}
                              </p>
                              <p className="truncate text-caption leading-tight text-fg-muted">
                                {contact.notes || "No notes"}
                              </p>
                            </div>
                            <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                              {formatRelativeDay(contact.nextFollowUp)}
                            </span>
                          </Link>
                          <div className="mt-1 flex gap-2 px-2 pb-1 pl-[3.75rem]">
                            <button
                              onClick={() => logContact(contact.id)}
                              aria-label={`Mark ${contact.name} contacted today`}
                              className="btn btn-primary flex-1"
                            >
                              <Check size={15} strokeWidth={1.75} />
                              Contacted
                            </button>
                            <button
                              onClick={() => snooze(contact.id, 7)}
                              aria-label={`Push ${contact.name} back one week`}
                              className="btn btn-quiet"
                            >
                              +1w
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
