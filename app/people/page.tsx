"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ContactList from "@/components/ContactList";
import Empty from "@/components/Empty";
import { useStore } from "@/lib/store";

type Sort = "name" | "recent" | "followUp";

const SORTS: { value: Sort; label: string }[] = [
  { value: "name", label: "A–Z" },
  { value: "recent", label: "Recently contacted" },
  { value: "followUp", label: "Follow-up" },
];

export default function PeoplePage() {
  const { contacts, ready } = useStore();
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("name");

  const labels = useMemo(() => {
    const all = new Set<string>();
    contacts.forEach((contact) => contact.labels.forEach((item) => all.add(item)));
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = contacts.filter((contact) => {
      if (label && !contact.labels.includes(label)) return false;
      if (!needle) return true;
      // Search across every field someone might remember a person by.
      return [
        contact.name,
        contact.company,
        contact.role,
        contact.email,
        contact.phone,
        contact.notes,
        contact.labels.join(" "),
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });

    const sorted = [...filtered];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "recent") {
      // Most recently contacted first; never-contacted sink to the bottom.
      sorted.sort((a, b) => (b.lastContacted ?? "").localeCompare(a.lastContacted ?? ""));
    } else {
      sorted.sort((a, b) => {
        if (!a.nextFollowUp) return 1;
        if (!b.nextFollowUp) return -1;
        return a.nextFollowUp.localeCompare(b.nextFollowUp);
      });
    }
    return sorted;
  }, [contacts, query, label, sort]);

  if (!ready) return <div className="h-64" aria-hidden />;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The index</p>
          <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-ink">
            People
          </h1>
        </div>
        <Link href="/people/new" className="btn btn-primary">
          Add contact
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company, notes…"
            aria-label="Search contacts"
            className="field sm:max-w-xs"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label="Sort contacts"
            className="field sm:w-auto"
          >
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {labels.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLabel(null)}
              className={`chip ${label === null ? "chip-clear" : ""}`}
            >
              All
            </button>
            {labels.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLabel(item === label ? null : item)}
                className={`chip ${item === label ? "chip-clear" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Empty
          title="Nothing matches"
          body={
            contacts.length === 0
              ? "Your index is empty. Add someone, or import a Google Contacts export."
              : "Try a different search term or clear the label filter."
          }
          action={contacts.length === 0 ? { href: "/import", label: "Import contacts" } : undefined}
        />
      ) : (
        <>
          <p className="eyebrow">
            {visible.length} {visible.length === 1 ? "person" : "people"}
          </p>
          <ContactList contacts={visible} />
        </>
      )}
    </div>
  );
}
