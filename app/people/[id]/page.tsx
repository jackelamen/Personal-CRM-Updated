"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { BackIcon, CheckIcon, ClockIcon, StarIcon } from "@/components/Icons";
import { formatDate, formatRelativeDay, isOverdue, todayInputDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { contacts, ready, toggleFavorite, logContact, snooze, setFollowUp, setNotes, deleteContact } =
    useStore();
  const [confirming, setConfirming] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

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
        <p className="text-[0.85rem]">That contact no longer exists.</p>
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
      <div className="toolbar flex items-center gap-2 px-3 py-2">
        <Link
          href="/people"
          aria-label="Back to people"
          className="btn btn-ghost px-1.5 lg:hidden"
        >
          <BackIcon className="h-[18px] w-[18px]" />
        </Link>
        <Avatar contact={contact} size="sm" ring={overdue} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9rem] font-semibold leading-tight">{contact.name}</p>
          <p className="truncate text-[0.75rem] leading-tight text-fg-muted">
            {[contact.role, contact.company].filter(Boolean).join(", ") || "No affiliation"}
          </p>
        </div>
        <button
          onClick={() => toggleFavorite(contact.id)}
          aria-pressed={Boolean(contact.favorite)}
          aria-label={contact.favorite ? "Unfavourite" : "Favourite"}
          className={`btn btn-ghost px-1.5 ${contact.favorite ? "text-fg" : ""}`}
        >
          <StarIcon filled={contact.favorite} className="h-[18px] w-[18px]" />
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
              <ClockIcon className={`h-4 w-4 ${overdue ? "text-danger" : "text-fg-muted"}`} />
              <p className="flex-1 text-[0.85rem]">
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
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => logContact(contact.id)} className="btn btn-primary">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Contacted
                </button>
                <button
                  onClick={() => snooze(contact.id, 7)}
                  aria-label="Follow up in one week"
                  className="btn btn-quiet"
                >
                  +1w
                </button>
                <button
                  onClick={() => snooze(contact.id, 30)}
                  aria-label="Follow up in one month"
                  className="btn btn-quiet"
                >
                  +1m
                </button>
                {contact.nextFollowUp ? (
                  <button
                    onClick={() => setFollowUp(contact.id, undefined)}
                    className="btn btn-ghost"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={() => setFollowUp(contact.id, todayInputDate())}
                    className="btn btn-quiet"
                  >
                    Today
                  </button>
                )}
              </div>
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
                  <dt className="w-28 shrink-0 text-[0.78rem] text-fg-muted">{item.label}</dt>
                  <dd className="min-w-0 flex-1 break-words text-[0.85rem]">
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
                <span className="text-[0.8rem]">Delete {contact.name}?</span>
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
