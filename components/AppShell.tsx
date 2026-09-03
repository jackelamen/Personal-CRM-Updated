"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { InboxIcon, ImportIcon, PeopleIcon, PlusIcon } from "./Icons";
import { useStore } from "@/lib/store";
import { daysUntil } from "@/lib/format";

const NAV = [
  { href: "/", label: "Today", Icon: InboxIcon },
  { href: "/people", label: "People", Icon: PeopleIcon },
  { href: "/import", label: "Data", Icon: ImportIcon },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Count of people who are due or overdue, shown as a badge on Today. */
function useDueCount() {
  const { contacts, ready } = useStore();
  if (!ready) return 0;
  return contacts.filter((c) => (daysUntil(c.nextFollowUp) ?? 99) <= 0).length;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const isActive = useActive();
  const due = useDueCount();

  return (
    <div className="flex h-dvh overflow-hidden bg-app">
      {/* Desktop rail */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-rail lg:flex">
        <div className="px-5 pb-2 pt-5">
          <span className="text-[0.9rem] font-semibold tracking-tight text-rail-fg">
            Rolodex
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.85rem] font-medium transition-colors ${
                  active
                    ? "bg-rail-active text-rail-fg"
                    : "text-rail-muted hover:bg-rail-active/60 hover:text-rail-fg"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{label}</span>
                {href === "/" && due > 0 ? (
                  <span className="rounded-full bg-signal px-1.5 py-0.5 text-[0.65rem] font-semibold tabular text-white">
                    {due}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Link
            href="/people/new"
            className="flex items-center justify-center gap-1.5 rounded-md bg-rail-active px-3 py-2 text-[0.85rem] font-medium text-rail-fg transition-colors hover:bg-rail-active/70"
          >
            <PlusIcon className="h-4 w-4" />
            New contact
          </Link>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-hidden pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors ${
                  active ? "text-fg" : "text-fg-muted"
                }`}
              >
                <Icon className="h-[21px] w-[21px]" />
                {label}
                {href === "/" && due > 0 ? (
                  <span className="absolute right-[22%] top-1.5 min-w-[16px] rounded-full bg-signal px-1 text-[0.6rem] font-semibold tabular leading-4 text-white">
                    {due}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <Link
            href="/people/new"
            aria-label="New contact"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium text-fg-muted"
          >
            <PlusIcon className="h-[21px] w-[21px]" />
            New
          </Link>
        </nav>
      </div>
    </div>
  );
}
