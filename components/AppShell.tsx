"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, Inbox, Plus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysUntil } from "@/lib/format";
import PWA from "./PWA";

const NAV = [
  { href: "/", label: "Today", Icon: Inbox },
  { href: "/people", label: "People", Icon: Users },
  { href: "/import", label: "Data", Icon: Database },
];

/** Count of people already due or overdue, badged on Today. */
function useDueCount() {
  const { contacts, ready } = useStore();
  if (!ready) return 0;
  return contacts.filter((c) => (daysUntil(c.nextFollowUp) ?? 99) <= 0).length;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const due = useDueCount();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    // The frame is fixed to the viewport; only panes inside it scroll.
    <div className="ground flex h-dvh overflow-hidden">
      {/* Desktop side rail */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-card lg:flex">
        <div className="px-5 pb-3 pt-5">
          <span className="text-title font-semibold tracking-tight">Rolodex</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[var(--size-tap)] items-center gap-3 rounded-xl px-3 text-callout font-semibold transition-colors ${
                  active
                    ? "bg-accent text-accent-ink"
                    : "text-fg-muted hover:bg-card-2 hover:text-fg"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {href === "/" && due > 0 ? (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-micro font-semibold tabular text-white">
                    {due}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Link href="/people/new" className="btn btn-primary w-full">
            <Plus size={18} strokeWidth={2} />
            New contact
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-hidden">
          {children}
        </main>

        {/*
          Floating pill nav with a separate circular action, rather than an
          edge-to-edge bar. Glass applies here: it is floating chrome.
        */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <div className="pointer-events-auto flex items-center gap-2">
            <nav className="navpill flex items-center gap-1 rounded-full p-1.5">
              {NAV.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    className="relative grid h-[var(--size-tap)] w-[var(--size-tap)] place-items-center rounded-full transition-colors"
                  >
                    <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
                    {href === "/" && due > 0 ? (
                      <span className="absolute right-0.5 top-0.5 min-w-[17px] rounded-full bg-danger px-1 text-micro font-bold tabular leading-[17px] text-white">
                        {due}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/people/new"
              aria-label="New contact"
              className="grid h-[52px] w-[52px] place-items-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_rgba(63,191,168,0.35)] transition-transform active:scale-95"
            >
              <Plus size={22} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </div>

      <PWA />
    </div>
  );
}
