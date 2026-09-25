"use client";

import Link from "next/link";
import Avatar from "./Avatar";
import { Check, Clock3 } from "lucide-react";
import { formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

/**
 * A triage row: who, what you owe them, when it is due, and the two actions
 * that clear it without leaving the list.
 */
export default function PersonRow({
  contact,
  trailing,
}: {
  contact: Contact;
  /** Overrides the due chip, e.g. a birthday countdown. */
  trailing?: React.ReactNode;
}) {
  const { logInteraction, snooze } = useStore();
  const overdue = isOverdue(contact.nextFollowUp);
  const subtitle =
    contact.nextStep ||
    [contact.role, contact.company].filter(Boolean).join(", ") ||
    contact.notes ||
    "No next step set";

  return (
    <li className="rounded-2xl p-1">
      <Link href={`/people/${contact.id}`} className="row">
        <Avatar contact={contact} ring={overdue} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body font-semibold leading-tight">{contact.name}</p>
          <p
            className={`truncate text-caption leading-tight ${
              contact.nextStep ? "text-fg" : "text-fg-muted"
            }`}
          >
            {subtitle}
          </p>
        </div>
        {trailing ??
          (contact.nextFollowUp ? (
            <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
              {formatRelativeDay(contact.nextFollowUp)}
            </span>
          ) : null)}
      </Link>
      {/* Full-width thumb targets on a phone; compact controls on a desktop. */}
      <div className="mt-1 flex gap-2 px-2 pb-1 pl-[3.75rem] sm:max-w-sm">
        <button
          onClick={() => logInteraction({ contactId: contact.id })}
          aria-label={`Log a touchpoint with ${contact.name} today`}
          className="btn btn-primary flex-1"
        >
          <Check size={15} strokeWidth={1.75} />
          Reached out
        </button>
        <button
          onClick={() => snooze(contact.id, 7)}
          aria-label={`Push ${contact.name} back one week`}
          className="btn btn-quiet"
        >
          <Clock3 size={15} strokeWidth={1.75} />
          1w
        </button>
      </div>
    </li>
  );
}
