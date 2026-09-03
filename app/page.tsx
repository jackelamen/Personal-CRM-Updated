"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Plate from "@/components/Plate";
import { CheckIcon } from "@/components/Icons";
import { daysUntil, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

type Scope = "overdue" | "week" | "all";

export default function TodayPage() {
  const { contacts, ready, logContact, snooze } = useStore();
  const [scope, setScope] = useState<Scope>("week");

  const buckets = useMemo(() => {
    const withDate = contacts
      .filter((c) => c.nextFollowUp)
      .sort((a, b) => (daysUntil(a.nextFollowUp) ?? 0) - (daysUntil(b.nextFollowUp) ?? 0));
    return {
      overdue: withDate.filter((c) => (daysUntil(c.nextFollowUp) ?? 1) <= 0),
      week: withDate.filter((c) => (daysUntil(c.nextFollowUp) ?? 99) <= 7),
      all: withDate,
    };
  }, [contacts]);

  if (!ready) return null;

  const list: Contact[] = buckets[scope];
  const SCOPES: { value: Scope; label: string; count: number }[] = [
    { value: "overdue", label: "Overdue", count: buckets.overdue.length },
    { value: "week", label: "This week", count: buckets.week.length },
    { value: "all", label: "All", count: buckets.all.length },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="toolbar flex flex-wrap items-center gap-2 px-4 py-2.5">
        <h1 className="text-[0.95rem] font-semibold">Today</h1>
        <div className="segment ml-auto" role="tablist" aria-label="Filter follow-ups">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              role="tab"
              aria-selected={scope === s.value}
              onClick={() => setScope(s.value)}
            >
              {s.label}
              <span className="ml-1 tabular text-fg-faint">{s.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pane flex-1">
        <div className="mx-auto max-w-3xl p-3 sm:p-4">
          {contacts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong bg-surface p-8 text-center">
              <p className="text-[0.9rem] font-medium">No contacts yet</p>
              <p className="mx-auto mt-1 max-w-xs text-[0.8rem] text-fg-muted">
                Import a Google Contacts export, or add someone by hand.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/import" className="btn btn-primary">Import</Link>
                <Link href="/people/new" className="btn btn-quiet">Add contact</Link>
              </div>
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface p-8 text-center">
              <p className="text-[0.9rem] font-medium">
                {scope === "overdue" ? "Nothing overdue." : "Nothing scheduled here."}
              </p>
              <p className="mt-1 text-[0.8rem] text-fg-muted">
                Set a follow-up on someone from their profile.
              </p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-line bg-surface">
              {list.map((contact) => {
                const overdue = isOverdue(contact.nextFollowUp);
                return (
                  <li
                    key={contact.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2.5 last:border-b-0"
                  >
                    {/* Left edge marks overdue without relying on colour alone;
                        the chip still spells the state out. */}
                    <span
                      aria-hidden
                      className={`h-8 w-0.5 rounded-full ${overdue ? "bg-signal" : "bg-transparent"}`}
                    />
                    <Plate contact={contact} size="sm" />
                    <div className="min-w-0 flex-1 basis-[calc(100%-5rem)] sm:basis-0">
                      <Link
                        href={`/people/${contact.id}`}
                        className="block truncate text-[0.875rem] font-medium leading-tight hover:underline"
                      >
                        {contact.name}
                      </Link>
                      <p className="truncate text-[0.78rem] leading-tight text-fg-muted">
                        {contact.notes || "No notes"}
                      </p>
                    </div>
                    <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                      {formatRelativeDay(contact.nextFollowUp)}
                    </span>
                    <div className="ml-auto flex gap-1.5">
                      {/* The label is hidden on narrow screens, so the button
                          carries its own accessible name. */}
                      <button
                        onClick={() => logContact(contact.id)}
                        aria-label={`Mark ${contact.name} contacted today`}
                        className="btn btn-primary"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Contacted</span>
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
        </div>
      </div>
    </div>
  );
}
