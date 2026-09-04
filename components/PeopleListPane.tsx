"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";
import { Search, Star } from "lucide-react";
import { daysUntil, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";

type Sort = "name" | "recent" | "due";

const SORTS: { value: Sort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "due", label: "Due" },
  { value: "recent", label: "Recent" },
];

export default function PeopleListPane() {
  const { contacts, ready, toggleFavorite } = useStore();
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("name");
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search from anywhere, the way a keyboard-driven app behaves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) {
        setQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const labels = useMemo(() => {
    const all = new Set<string>();
    contacts.forEach((c) => c.labels.forEach((l) => all.add(l)));
    return [...all].sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = contacts.filter((contact) => {
      if (label && !contact.labels.includes(label)) return false;
      if (!needle) return true;
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
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "recent")
      sorted.sort((a, b) => (b.lastContacted ?? "").localeCompare(a.lastContacted ?? ""));
    else
      sorted.sort(
        (a, b) => (daysUntil(a.nextFollowUp) ?? 9e4) - (daysUntil(b.nextFollowUp) ?? 9e4),
      );
    return sorted;
  }, [contacts, query, label, sort]);

  return (
    <>
      <div className="appbar glass px-3 pb-2 pt-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} strokeWidth={1.75} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people"
              aria-label="Search people"
              className="field rounded-full pl-9 pr-9"
            />
            <span className="kbd pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block">
              /
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="segment" role="tablist" aria-label="Sort people">
            {SORTS.map((option) => (
              <button
                key={option.value}
                role="tab"
                aria-selected={sort === option.value}
                onClick={() => setSort(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="label tabular">{visible.length}</span>
        </div>

        {labels.length > 0 ? (
          <div className="-mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 pb-1">
            <button
              onClick={() => setLabel(null)}
              className={`chip ${label === null ? "chip-on" : ""}`}
            >
              All
            </button>
            {labels.map((item) => (
              <button
                key={item}
                onClick={() => setLabel(item === label ? null : item)}
                className={`chip ${item === label ? "chip-on" : ""}`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pane flex-1 bg-bg">
        {!ready ? null : visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-callout text-fg-muted">
            {contacts.length === 0 ? (
              <>
                No contacts yet.{" "}
                <Link href="/import" className="underline">
                  Import a file
                </Link>{" "}
                or add someone.
              </>
            ) : (
              "Nothing matches."
            )}
          </p>
        ) : (
          <ul className="space-y-1 px-2 pb-2">
            {visible.map((contact) => {
              const overdue = isOverdue(contact.nextFollowUp);
              return (
                <li
                  key={contact.id}
                  className="row"
                  data-selected={params?.id === contact.id}
                  onClick={() => router.push(`/people/${contact.id}`)}
                >
                  <Avatar contact={contact} size="sm" ring={overdue} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium leading-tight text-fg">
                      {contact.name}
                    </p>
                    <p className="truncate text-callout leading-tight text-fg-muted">
                      {[contact.role, contact.company].filter(Boolean).join(", ") ||
                        contact.email ||
                        contact.phone ||
                        "—"}
                    </p>
                  </div>
                  {contact.nextFollowUp ? (
                    <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                      {formatRelativeDay(contact.nextFollowUp)}
                    </span>
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(contact.id);
                    }}
                    aria-pressed={Boolean(contact.favorite)}
                    aria-label={
                      contact.favorite
                        ? `Unfavourite ${contact.name}`
                        : `Favourite ${contact.name}`
                    }
                    className={`grid h-[var(--size-tap)] w-[var(--size-tap)] shrink-0 place-items-center rounded-full transition-colors ${
                      contact.favorite ? "text-accent" : "text-line-2 hover:text-fg-muted"
                    }`}
                  >
                    <Star size={16} strokeWidth={1.75} fill={contact.favorite ? "currentColor" : "none"} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
