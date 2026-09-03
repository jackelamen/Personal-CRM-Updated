"use client";

import Link from "next/link";
import ContactList from "@/components/ContactList";
import Empty from "@/components/Empty";
import Plate from "@/components/Plate";
import { daysUntil, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Contact } from "@/lib/types";

function byFollowUp(a: Contact, b: Contact) {
  return (daysUntil(a.nextFollowUp) ?? 0) - (daysUntil(b.nextFollowUp) ?? 0);
}

export default function TodayPage() {
  const { contacts, ready, logContact } = useStore();

  // Nothing renders from storage until it has been read, so the server markup
  // and the first client render agree.
  if (!ready) return <div className="h-64" aria-hidden />;

  if (contacts.length === 0) {
    return (
      <Empty
        title="No one here yet"
        body="Add a contact by hand, or bring in a Google Contacts export to get started."
        action={{ href: "/import", label: "Import contacts" }}
      />
    );
  }

  const due = contacts
    .filter((contact) => (daysUntil(contact.nextFollowUp) ?? 99) <= 7)
    .sort(byFollowUp);

  const later = contacts
    .filter((contact) => (daysUntil(contact.nextFollowUp) ?? -1) > 7)
    .sort(byFollowUp)
    .slice(0, 5);

  const overdueCount = due.filter((contact) => isOverdue(contact.nextFollowUp)).length;

  return (
    <div className="space-y-14">
      <section>
        <p className="eyebrow">
          <time>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </time>
        </p>
        <h1 className="font-display mt-3 max-w-2xl text-[2.6rem] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[3.25rem]">
          {due.length === 0 ? (
            <>No one is waiting on you today.</>
          ) : overdueCount > 0 ? (
            <>
              You are{" "}
              <em className="not-italic text-signal-deep">
                {overdueCount} {overdueCount === 1 ? "reply" : "replies"} behind
              </em>
              .
            </>
          ) : (
            <>
              {due.length} {due.length === 1 ? "person" : "people"} to reach out to
              this week.
            </>
          )}
        </h1>
      </section>

      {due.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-4">Due now</h2>
          <ul className="space-y-3">
            {due.map((contact, index) => {
              const overdue = isOverdue(contact.nextFollowUp);
              return (
                <li
                  key={contact.id}
                  className={`settle flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border bg-card p-4 ${
                    overdue ? "border-signal/40" : "border-rule"
                  }`}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <Plate contact={contact} />
                  {/* Fills the rest of row one on narrow screens, so the chip
                      and button wrap below rather than crowding the name. */}
                  <div className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] sm:basis-0">
                    <Link
                      href={`/people/${contact.id}`}
                      className="font-display text-lg text-ink hover:underline"
                    >
                      {contact.name}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {contact.notes || "No notes yet."}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className={`chip ${overdue ? "chip-overdue" : ""}`}>
                      {formatRelativeDay(contact.nextFollowUp)}
                    </span>
                    <button
                      type="button"
                      onClick={() => logContact(contact.id)}
                      className="btn btn-quiet"
                    >
                      Mark contacted
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {later.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-4">Coming up</h2>
          <ContactList contacts={later} />
        </section>
      ) : null}
    </div>
  );
}
