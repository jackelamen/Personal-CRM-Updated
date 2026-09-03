"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Plate from "@/components/Plate";
import Star from "@/components/Star";
import { formatDate, formatRelativeDay, isOverdue } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { contacts, ready, toggleFavorite, logContact, deleteContact } = useStore();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const contact = contacts.find((item) => item.id === params.id);

  if (!ready) return <div className="h-64" aria-hidden />;

  if (!contact) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl text-ink">Contact not found</p>
        <p className="mt-2 text-sm text-muted">
          It may have been deleted from this browser.
        </p>
        <Link href="/people" className="btn btn-quiet mt-6">
          Back to people
        </Link>
      </div>
    );
  }

  const details = [
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { label: "Phone", value: contact.phone, href: `tel:${contact.phone}` },
    { label: "Company", value: contact.company },
    { label: "Role", value: contact.role },
    { label: "Birthday", value: formatDate(contact.birthday) },
    { label: "Last contacted", value: formatDate(contact.lastContacted) },
  ].filter((item) => item.value);

  return (
    <article className="space-y-10">
      <Link href="/people" className="eyebrow inline-block hover:underline">
        ← People
      </Link>

      <header className="flex flex-wrap items-start gap-5">
        <Plate contact={contact} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl leading-tight tracking-[-0.015em] text-ink">
            {contact.name}
          </h1>
          {contact.role || contact.company ? (
            <p className="mt-1 text-muted">
              {[contact.role, contact.company].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {contact.labels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {contact.labels.map((label) => (
                <span key={label} className="chip">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => logContact(contact.id)} className="btn btn-primary">
          Mark contacted today
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(contact.id)}
          aria-pressed={Boolean(contact.favorite)}
          className={`btn ${contact.favorite ? "btn-primary" : "btn-quiet"}`}
        >
          <Star filled={Boolean(contact.favorite)} />
          {contact.favorite ? "Favourite" : "Add to favourites"}
        </button>
        <Link href={`/people/${contact.id}/edit`} className="btn btn-quiet">
          Edit
        </Link>
      </div>

      {contact.nextFollowUp ? (
        <div
          className={`rounded-lg border p-5 ${
            isOverdue(contact.nextFollowUp)
              ? "border-signal bg-signal-wash"
              : "border-rule bg-card"
          }`}
        >
          <p className="eyebrow">Next follow-up</p>
          <p className="font-display mt-1 text-2xl text-ink">
            {formatRelativeDay(contact.nextFollowUp)}
            <span className="ml-2 text-base font-normal text-muted">
              {formatDate(contact.nextFollowUp)}
            </span>
          </p>
        </div>
      ) : null}

      {details.length > 0 ? (
        <section>
          <h2 className="eyebrow mb-3">Details</h2>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="border-t border-rule pt-3">
                <dt className="eyebrow">{item.label}</dt>
                <dd className="mt-1 break-words text-[0.95rem] text-ink">
                  {item.href ? (
                    <a href={item.href} className="hover:underline hover:underline">
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section>
        <h2 className="eyebrow mb-3">Notes</h2>
        <div className="rounded-lg border border-rule bg-card p-5">
          {contact.notes ? (
            <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">
              {contact.notes}
            </p>
          ) : (
            <p className="text-sm text-faint">
              Nothing written down yet. Use Edit to add what you want to remember.
            </p>
          )}
        </div>
      </section>

      <section className="rule pt-6">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink">
              Delete {contact.name} permanently?
            </p>
            <button
              type="button"
              onClick={() => {
                deleteContact(contact.id);
                router.push("/people");
              }}
              className="btn btn-primary"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="btn btn-danger"
          >
            Delete contact
          </button>
        )}
      </section>
    </article>
  );
}
