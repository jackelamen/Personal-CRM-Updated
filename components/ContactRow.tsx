"use client";

import Link from "next/link";
import Plate from "./Plate";
import Star from "./Star";
import { formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

/** One person in a list: monogram, name, affiliation, follow-up state. */
export default function ContactRow({ contact }: { contact: Contact }) {
  const { toggleFavorite } = useStore();
  const affiliation = [contact.role, contact.company].filter(Boolean).join(", ");
  const due = contact.nextFollowUp;
  const overdue = isOverdue(due);

  return (
    <li className="group relative flex items-center gap-4 border-b border-rule py-3.5 last:border-b-0">
      <Plate contact={contact} size="sm" />

      <div className="min-w-0 flex-1">
        <Link href={`/people/${contact.id}`} className="block">
          {/* The whole row is the click target; the favourite button below
              sits above it so it stays independently clickable. */}
          <span className="absolute inset-0" aria-hidden />
          <span className="font-display text-[1.05rem] leading-snug text-ink group-hover:underline">
            {contact.name}
          </span>
        </Link>
        <p className="truncate text-sm text-muted">
          {affiliation || contact.email || contact.phone || "No details yet"}
        </p>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        {due ? (
          <span className={`chip ${overdue ? "chip-overdue" : ""} hidden sm:inline-flex`}>
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
          className={`rounded p-1.5 transition-colors ${
            contact.favorite
              ? "text-ink"
              : "text-rule-strong hover:text-muted"
          }`}
        >
          <Star filled={Boolean(contact.favorite)} />
        </button>
      </div>
    </li>
  );
}
