"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { Database, Inbox, Plus, Search, Users } from "lucide-react";
import { useStore } from "@/lib/store";

type Command = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
  Icon?: typeof Inbox;
  contactId?: string;
};

/**
 * Cmd/Ctrl-K to reach any person or screen without navigating. On a list that
 * runs to hundreds of contacts, typing a name is the fastest path there is.
 */
export default function CommandPalette() {
  const router = useRouter();
  const { contacts } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // The input mounts with the overlay, so focus waits a frame.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo<Command[]>(() => {
    const needle = query.trim().toLowerCase();

    const screens: Command[] = [
      { id: "nav-today", label: "Today", Icon: Inbox, run: () => router.push("/") },
      { id: "nav-people", label: "People", Icon: Users, run: () => router.push("/people") },
      { id: "nav-new", label: "Add a contact", Icon: Plus, run: () => router.push("/people/new") },
      { id: "nav-data", label: "Import & data", Icon: Database, run: () => router.push("/import") },
    ].filter((item) => !needle || item.label.toLowerCase().includes(needle));

    const people: Command[] = contacts
      .filter((contact) => {
        if (!needle) return false;
        return [contact.name, contact.company, contact.role, contact.email, contact.phone]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(needle));
      })
      .slice(0, 8)
      .map((contact) => ({
        id: contact.id,
        contactId: contact.id,
        label: contact.name,
        hint: [contact.role, contact.company].filter(Boolean).join(", ") || undefined,
        run: () => router.push(`/people/${contact.id}`),
      }));

    return [...people, ...screens];
  }, [query, contacts, router]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const choose = (command?: Command) => {
    if (!command) return;
    command.run();
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line-2 bg-card shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="relative border-b border-line">
          <Search
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                choose(results[active]);
              }
            }}
            placeholder="Jump to a person or a screen"
            aria-label="Search people and screens"
            className="field border-0 bg-transparent pl-10 text-body"
          />
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-callout text-fg-muted">
              Nothing matches.
            </li>
          ) : (
            results.map((command, index) => {
              const contact = command.contactId
                ? contacts.find((c) => c.id === command.contactId)
                : undefined;
              return (
                <li key={command.id}>
                  <button
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(command)}
                    aria-selected={index === active}
                    className={`flex w-full min-h-[var(--size-tap)] items-center gap-3 rounded-xl px-2.5 text-left transition-colors ${
                      index === active ? "bg-card-2" : ""
                    }`}
                  >
                    {contact ? (
                      <Avatar contact={contact} size="sm" />
                    ) : command.Icon ? (
                      <span className="icon-chip bg-card-2 text-accent">
                        <command.Icon size={16} strokeWidth={1.9} />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-medium">{command.label}</span>
                      {command.hint ? (
                        <span className="block truncate text-caption text-fg-muted">
                          {command.hint}
                        </span>
                      ) : null}
                    </span>
                    {index === active ? <span className="kbd">↵</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
