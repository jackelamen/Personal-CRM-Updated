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

  // Nothing is rendered from storage until it has been read, so the server
  // markup and the first client render agree.
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
    .filter((contact) => contact.nextFollowUp && (daysUntil(contact.nextFollowUp) ?? 99) <= 7)
    .sort(byFollowUp);

  const upcoming = contacts
    .filter((contact) => {
      const days = daysUntil(contact.nextFollowUp);
      return days !== null && days > 7;
    })
    .sort(byFollowUp)
    .slice(0, 4);

  const favorites = contacts.filter((contact) => contact.favorite);
  const overdueCount = due.filter((contact) => isOverdue(contact.nextFollowUp)).length;

  return (
    <div className="space-y-14">
      <section>
        <p className="eyebrow">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="font-display mt-2 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          {due.length === 0 ? (
            "Nothing needs chasing today."
          ) : (
            <>
              {due.length} {due.length === 1 ? "person" : "people"} to reach out to
              {overdueCount > 0 ? (
                <span className="text-coral">
                  , {overdueCount} overdue
                </span>
              ) : null}
              .
            </>
          )}
        </h1>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {[
            { label: "Contacts", value: contacts.length },
            { label: "Favourites", value: favorites.length },
            { label: "Scheduled", value: contacts.filter((c) => c.nextFollowUp).length },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="eyebrow">{stat.label}</dt>
              <dd className="font-display text-3xl font-semibold text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {due.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-4">Due now</h2>
          <ul className="space-y-3">
            {due.map((contact, index) => (
              <li
                key={contact.id}
                className="rise flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-rule bg-white/70 p-4"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <Plate contact={contact} />
                {/* On narrow screens this fills the rest of row one, pushing the
                    chip and button onto their own row instead of crowding the name. */}
                <div className="min-w-0 flex-1 basis-[calc(100%-3.75rem)] sm:basis-0">
                  <Link
                    href={`/people/${contact.id}`}
                    className="font-display text-lg font-semibold text-ink hover:text-coral-deep"
                  >
                    {contact.name}
                  </Link>
                  <p className="truncate text-sm text-ink-soft">
                    {contact.notes || "No notes yet."}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className={`chip ${isOverdue(contact.nextFollowUp) ? "chip-due" : ""}`}>
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
            ))}
          </ul>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-4">Later</h2>
          <ContactList contacts={upcoming} />
        </section>
      ) : null}

      {favorites.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-4">Favourites</h2>
          <ContactList contacts={favorites} />
        </section>
      ) : null}
    </div>
  );
}
