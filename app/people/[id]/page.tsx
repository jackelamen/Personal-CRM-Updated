"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { Check, ChevronLeft, Clock, Star } from "lucide-react";
import { formatDate, formatRelativeDay, isOverdue, todayInputDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { contacts, ready, toggleFavorite, logContact, setFollowUp, setNotes, deleteContact } =
    useStore();
  const [confirming, setConfirming] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [logDate, setLogDate] = useState("");

  const contact = contacts.find((item) => item.id === params.id);

  // Reset the notes draft when switching person in the master-detail pane.
  useEffect(() => {
    setDraftNotes(contact?.notes ?? "");
    setConfirming(false);
  }, [contact?.id, contact?.notes]);

  if (!ready) return null;

  if (!contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-fg-muted">
        <p className="text-body">That contact no longer exists.</p>
        <Link href="/people" className="btn btn-quiet">Back to people</Link>
      </div>
    );
  }

  const overdue = isOverdue(contact.nextFollowUp);
  const details = [
    { label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { label: "Phone", value: contact.phone, href: `tel:${contact.phone}` },
    { label: "Company", value: contact.company },
    { label: "Role", value: contact.role },
    { label: "Birthday", value: formatDate(contact.birthday) },
    { label: "Last contacted", value: formatDate(contact.lastContacted) || "Never" },
  ].filter((item) => item.value);

  const commitNotes = () => {
    if (draftNotes === (contact.notes ?? "")) return;
    setNotes(contact.id, draftNotes);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  return (
    <>
      <div className="appbar glass flex items-center gap-2 px-3 py-2">
        <Link
          href="/people"
          aria-label="Back to people"
          className="icon-circle shrink-0 lg:hidden"
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
        </Link>
        <Avatar contact={contact} size="sm" ring={overdue} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-headline font-semibold leading-tight">{contact.name}</p>
          <p className="truncate text-caption leading-tight text-fg-muted">
            {[contact.role, contact.company].filter(Boolean).join(", ") || "No affiliation"}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(contact.id)}
          aria-pressed={Boolean(contact.favorite)}
          aria-label={contact.favorite ? "Unfavourite" : "Favourite"}
          className={`icon-circle shrink-0 ${contact.favorite ? "text-accent" : ""}`}
        >
          <Star size={18} strokeWidth={1.75} fill={contact.favorite ? "currentColor" : "none"} />
        </button>
        <Link href={`/people/${contact.id}/edit`} className="btn btn-quiet">Edit</Link>
      </div>

      <div className="pane flex-1">
        <div className="mx-auto max-w-2xl space-y-5 p-4">
          {/* Follow-up: the one thing this app exists to keep on top of. */}
          <section
            className={`rounded-2xl border p-3 ${
              overdue ? "border-danger/40 bg-danger-wash" : "border-line bg-card"
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Clock size={16} strokeWidth={1.75} />
              <p className="flex-1 text-body">
                {contact.nextFollowUp ? (
                  <>
                    <span className={overdue ? "font-semibold text-danger" : "font-medium"}>
                      {formatRelativeDay(contact.nextFollowUp)}
                    </span>
                    <span className="text-fg-muted"> · {formatDate(contact.nextFollowUp)}</span>
                  </>
                ) : (
                  <span className="text-fg-muted">No follow-up scheduled</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => logContact(contact.id)} className="btn btn-primary">
                  <Check size={15} strokeWidth={1.75} />
                  Contacted today
                </button>
                <label className="flex items-center gap-1.5">
                  <span className="sr-only">Log contact on a specific date</span>
                  <input
                    type="date"
                    value={logDate}
                    max={todayInputDate()}
                    onChange={(e) => setLogDate(e.target.value)}
                    aria-label="Log contact on a different date"
                    className="field w-[8.75rem] py-1.5 text-callout"
                  />
                </label>
                {logDate ? (
                  <button
                    onClick={() => {
                      logContact(contact.id, logDate);
                      setLogDate("");
                    }}
                    className="btn btn-quiet"
                  >
                    Log
                  </button>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
              <span className="text-callout text-fg-muted">Next follow-up</span>
              <input
                type="date"
                value={contact.nextFollowUp ?? ""}
                onChange={(e) => setFollowUp(contact.id, e.target.value || undefined)}
                className="field w-[8.75rem] py-1.5 text-callout"
              />
              {contact.nextFollowUp ? (
                <button onClick={() => setFollowUp(contact.id, undefined)} className="btn btn-ghost">
                  Clear
                </button>
              ) : null}
            </div>
          </section>

          {contact.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contact.labels.map((l) => <span key={l} className="chip">{l}</span>)}
            </div>
          ) : null}

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="label">Notes</h2>
              {savedFlash ? <span className="chip chip-ok">Saved</span> : null}
            </div>
            {/* Edited in place and saved on blur; no round trip to a form page. */}
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              onBlur={commitNotes}
              rows={5}
              placeholder="What do you want to remember about this person?"
              className="field resize-y leading-relaxed"
            />
          </section>

          <section>
            <h2 className="label mb-1.5">Details</h2>
            <dl className="overflow-hidden rounded-2xl border border-line bg-card">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="flex gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0"
                >
                  <dt className="w-28 shrink-0 text-callout text-fg-muted">{item.label}</dt>
                  <dd className="min-w-0 flex-1 break-words text-body">
                    {item.href ? (
                      <a href={item.href} className="text-accent underline-offset-2 hover:underline">
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

          <section className="border-t border-line pt-4">
            {confirming ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-callout">Delete {contact.name}?</span>
                <button
                  onClick={() => {
                    deleteContact(contact.id);
                    router.push("/people");
                  }}
                  className="btn btn-primary"
                >
                  Delete
                </button>
                <button onClick={() => setConfirming(false)} className="btn btn-quiet">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirming(true)} className="btn btn-danger">
                Delete contact
              </button>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
