"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/people", label: "People" },
  { href: "/import", label: "Import & data" },
];

export default function SiteNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-rule py-6">
      <Link href="/" className="group flex items-baseline gap-2.5">
        <span className="font-display text-2xl font-semibold tracking-tight text-ink">
          Rolodex
        </span>
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-coral transition-transform duration-200 group-hover:scale-150"
        />
      </Link>

      <nav className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:bg-paper-2 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
