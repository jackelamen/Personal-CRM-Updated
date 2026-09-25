"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";
import { CheckSquare, Search, Square, Star, X } from "lucide-react";
import { addDays, daysSince, daysUntil, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CADENCES } from "@/lib/types";

type Sort = "name" | "recent" | "due" | "attention";

const SORTS: { value: Sort; label: string }[] = [
  { value: "attention", label: "Attention" },
  { value: "name", label: "Name" },
  { value: "due", label: "Due" },
  { value: "recent", label: "Recent" },
];

export default function PeopleListPane() {
  const { contacts, ready, toggleFavorite, bulkUpdate } = useStore();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("name");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newLabel, setNewLabel] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Arriving from "Set a rhythm for them" opens straight into triage mode,
  // pre-filtered to the people who have no plan at all.
  const triage = searchParams.get("triage") === "1";
  useEffect(() => {
    if (triage) {
      setSelecting(true);
      setSort("attention");
    }
  }, [triage]);

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
      if (triage && (contact.nextFollowUp || contact.cadenceDays)) return false;
      if (label && !contact.labels.includes(label)) return false;
      if (!needle) return true;
      return [
        contact.name,
        contact.company,
        contact.role,
        contact.email,
        contact.phone,
        contact.notes,
        contact.nextStep,
        contact.labels.join(" "),
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });

    const sorted = [...filtered];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "recent")
      sorted.sort((a, b) => (b.lastContacted ?? "").localeCompare(a.lastContacted ?? ""));
    else if (sort === "due")
      sorted.sort(
        (a, b) => (daysUntil(a.nextFollowUp) ?? 9e4) - (daysUntil(b.nextFollowUp) ?? 9e4),
      );
    else {
      /*
        "Attention" is the order you would actually work the list in: what is
        already late, then what has no plan and has gone longest without
        contact, then everything that is genuinely handled.
      */
      const weight = (c: (typeof contacts)[number]) => {
        const due = daysUntil(c.nextFollowUp);
        if (due !== null && due <= 0) return -1_000_000 + due;
        if (!c.nextFollowUp && !c.cadenceDays) {
          const since = daysSince(c.lastContacted);
          return -500_000 + (since === null ? -1_000 : -Math.min(since, 999));
        }
        return due ?? 9e4;
      };
      sorted.sort((a, b) => weight(a) - weight(b) || a.name.localeCompare(b.name));
    }
    return sorted;
  }, [contacts, query, label, sort, triage]);

  const clearSelection = () => {
    setSelected(new Set());
    setSelecting(false);
    setNewLabel("");
  };

  const toggleSelected = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ids = [...selected];

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
          <button
            onClick={() => (selecting ? clearSelection() : setSelecting(true))}
            aria-pressed={selecting}
            aria-label={selecting ? "Leave selection mode" : "Select several people"}
            className="icon-circle shrink-0"
          >
            {selecting ? <X size={17} strokeWidth={1.9} /> : <CheckSquare size={17} strokeWidth={1.9} />}
          </button>
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

        {triage ? (
          <p className="mt-2 rounded-xl border border-accent-dim bg-card-2 px-3 py-2 text-caption text-fg-muted">
            Showing only people with no follow-up and no rhythm. Select them and
            give them one.{" "}
            <Link href="/people" className="text-accent underline-offset-2 hover:underline">
              Show everyone
            </Link>
          </p>
        ) : null}

        {labels.length > 0 && !selecting ? (
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

        {selecting ? (
          <div className="mt-2 space-y-2 rounded-xl border border-line bg-card-2 p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label tabular">{ids.length} selected</span>
              <button
                onClick={() =>
                  setSelected(
                    ids.length === visible.length
                      ? new Set()
                      : new Set(visible.map((c) => c.id)),
                  )
                }
                className="btn btn-ghost"
              >
                {ids.length === visible.length ? "None" : `All ${visible.length}`}
              </button>
            </div>

            {ids.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-caption text-fg-muted">Rhythm</span>
                  {CADENCES.filter((c) => c.value !== undefined).map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        bulkUpdate(ids, { cadenceDays: option.value });
                        clearSelection();
                      }}
                      className="chip"
                    >
                      {option.short}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-caption text-fg-muted">Follow up</span>
                  {[
                    { label: "Today", days: 0 },
                    { label: "1w", days: 7 },
                    { label: "1m", days: 30 },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        bulkUpdate(ids, { nextFollowUp: addDays(option.days) });
                        clearSelection();
                      }}
                      className="chip"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!newLabel.trim()) return;
                    bulkUpdate(ids, { addLabel: newLabel });
                    clearSelection();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    value={newLabel}
                    onChange={(event) => setNewLabel(event.target.value)}
                    placeholder="Add a label, e.g. SHOPLINE"
                    aria-label="Label to add to the selected people"
                    className="field py-1.5 text-callout"
                  />
                  <button type="submit" disabled={!newLabel.trim()} className="btn btn-quiet">
                    Tag
                  </button>
                </form>
              </>
            ) : (
              <p className="text-caption text-fg-muted">
                Pick people to set a rhythm, schedule a follow-up, or tag them all at once.
              </p>
            )}
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
            ) : triage ? (
              "Everyone has a follow-up or a rhythm. Nothing to triage."
            ) : (
              "Nothing matches."
            )}
          </p>
        ) : (
          <ul className="space-y-1 px-2 pb-2">
            {visible.map((contact) => {
              const overdue = isOverdue(contact.nextFollowUp);
              const picked = selected.has(contact.id);
              return (
                <li
                  key={contact.id}
                  className="row"
                  data-selected={selecting ? picked : params?.id === contact.id}
                  onClick={() =>
                    selecting ? toggleSelected(contact.id) : router.push(`/people/${contact.id}`)
                  }
                >
                  {selecting ? (
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center ${
                        picked ? "text-accent" : "text-line-2"
                      }`}
                      aria-hidden
                    >
                      {picked ? (
                        <CheckSquare size={19} strokeWidth={2} />
                      ) : (
                        <Square size={19} strokeWidth={2} />
                      )}
                    </span>
                  ) : (
                    <Avatar contact={contact} size="sm" ring={overdue} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium leading-tight text-fg">
                      {contact.name}
                    </p>
                    <p className="truncate text-callout leading-tight text-fg-muted">
                      {contact.nextStep ||
                        [contact.role, contact.company].filter(Boolean).join(", ") ||
                        contact.email ||
                        contact.phone ||
                        "—"}
                    </p>
                  </div>
                  {contact.cadenceDays && !contact.nextFollowUp ? (
                    <span className="chip">
                      {CADENCES.find((c) => c.value === contact.cadenceDays)?.short ?? "rhythm"}
                    </span>
                  ) : null}
                  {contact.nextFollowUp ? (
                    <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                      {formatRelativeDay(contact.nextFollowUp)}
                    </span>
                  ) : null}
                  {selecting ? null : (
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
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
