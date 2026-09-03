"use client";

import Link from "next/link";
import Plate from "./Plate";
import { formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

/** One person in a list: monogram, name, affiliation, follow-up state. */
export default function ContactRow({
  contact,
  index = 0,
}: {
  contact: Contact;
  index?: number;
}) {
  const { toggleFavorite } = useStore();
  const affiliation = [contact.role, contact.company].filter(Boolean).join(" · ");
  const due = contact.nextFollowUp;

  return (
    <li
      className="rise group relative flex items-center gap-4 border-b border-rule py-3.5 last:border-b-0"
      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
    >
      <Plate contact={contact} />

      <div className="min-w-0 flex-1">
        <Link href={`/people/${contact.id}`} className="block">
          {/* Stretched link: the whole row is the click target, but the
              favourite button below stays independently clickable. */}
          <span className="absolute inset-0" aria-hidden />
          <span className="font-display text-[1.05rem] font-semibold leading-snug text-ink group-hover:text-coral-deep">
            {contact.name}
          </span>
        </Link>
        <p className="truncate text-sm text-ink-soft">
          {affiliation || contact.email || contact.phone || "No details yet"}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        {due ? (
          <span className={`chip ${isOverdue(due) ? "chip-due" : ""} hidden sm:inline-flex`}>
            {formatRelativeDay(due)}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => toggleFavorite(contact.id)}
          aria-pressed={Boolean(contact.favorite)}
          aria-label={
            contact.favorite
              ? `Remove ${contact.name} from favourites`
              : `Add ${contact.name} to favourites`
          }
          className="rounded p-1 text-lg leading-none transition-colors"
        >
          <span className={contact.favorite ? "text-coral" : "text-ink-faint/50 hover:text-ink-faint"}>
            {contact.favorite ? "●" : "○"}
          </span>
        </button>
      </div>
    </li>
  );
}
