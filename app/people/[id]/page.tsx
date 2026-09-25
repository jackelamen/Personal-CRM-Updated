"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { LogTouchpoint, Timeline } from "@/components/Touchpoints";
import {
  Cake,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Repeat,
  Star,
} from "lucide-react";
import {
  daysSince,
  daysUntilBirthday,
  formatDate,
  formatRelativeDay,
  isOverdue,
} from "@/lib/format";
import { useStore } from "@/lib/store";
import { CADENCES } from "@/lib/types";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    contacts,
    ready,
    toggleFavorite,
    setFollowUp,
    setNotes,
    setCadence,
    setNextStep,
    deleteContact,
  } = useStore();
  const [confirming, setConfirming] = useState(false);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftNextStep, setDraftNextStep] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const contact = contacts.find((item) => item.id === params.id);

  // Reset the drafts when switching person in the master-detail pane.
  useEffect(() => {
    setDraftNotes(contact?.notes ?? "");
    setDraftNextStep(contact?.nextStep ?? "");
    setConfirming(false);
  }, [contact?.id, contact?.notes, contact?.nextStep]);

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
  const sinceLast = daysSince(contact.lastContacted);
  const birthdayIn = daysUntilBirthday(contact.birthday);

  const commitNotes = () => {
    if (draftNotes === (contact.notes ?? "")) return;
    setNotes(contact.id, draftNotes);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  const commitNextStep = () => {
    if (draftNextStep === (contact.nextStep ?? "")) return;
    setNextStep(contact.id, draftNextStep);
  };

  const copy = (label: string, value: string) => {
    void navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1400);
  };

  const details = [
    { label: "Email", value: contact.email },
    { label: "Phone", value: contact.phone },
    { label: "Company", value: contact.company },
    { label: "Role", value: contact.role },
    { label: "Birthday", value: formatDate(contact.birthday) },
  ].filter((item) => item.value);

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
          {/* Reach them: the fastest thing you came here to do. */}
          {contact.phone || contact.email ? (
            <div className="flex flex-wrap gap-2">
              {contact.phone ? (
                <>
                  <a href={`tel:${contact.phone}`} className="btn btn-quiet flex-1">
                    <Phone size={15} strokeWidth={1.9} />
                    Call
                  </a>
                  <a href={`sms:${contact.phone}`} className="btn btn-quiet flex-1">
                    <MessageSquare size={15} strokeWidth={1.9} />
                    Text
                  </a>
                </>
              ) : null}
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="btn btn-quiet flex-1">
                  <Mail size={15} strokeWidth={1.9} />
                  Email
                </a>
              ) : null}
            </div>
          ) : null}

          {/* What you owe them, when, and how often — the working surface. */}
          {/*
            Overdue is carried by the border and the chip, not by flooding the
            whole surface — this card is where the work happens, and a working
            surface that turns into an error state on the most common day is
            harder to use, not more urgent.
          */}
          <section
            className={`space-y-3 rounded-2xl border bg-card p-3 ${
              overdue ? "border-danger/50" : "border-line"
            }`}
          >
            <div>
              <label className="label" htmlFor="next-step">
                Next step
              </label>
              <input
                id="next-step"
                value={draftNextStep}
                onChange={(e) => setDraftNextStep(e.target.value)}
                onBlur={commitNextStep}
                placeholder="e.g. send the SHOPLINE pricing sheet"
                className="field mt-1"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-1.5 text-callout text-fg-muted">
                <Clock size={15} strokeWidth={1.9} />
                Follow up
              </span>
              <input
                type="date"
                value={contact.nextFollowUp ?? ""}
                onChange={(e) => setFollowUp(contact.id, e.target.value || undefined)}
                aria-label="Next follow-up date"
                className="field w-[8.75rem] py-1.5 text-callout"
              />
              {contact.nextFollowUp ? (
                <>
                  <span
                    className={`chip ${overdue ? "chip-overdue" : ""}`}
                  >
                    {formatRelativeDay(contact.nextFollowUp)}
                  </span>
                  <button
                    onClick={() => setFollowUp(contact.id, undefined)}
                    className="btn btn-ghost"
                  >
                    Clear
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-1.5 text-callout text-fg-muted">
                <Repeat size={15} strokeWidth={1.9} />
                Rhythm
              </span>
              <select
                value={contact.cadenceDays ?? ""}
                onChange={(e) =>
                  setCadence(contact.id, e.target.value ? Number(e.target.value) : undefined)
                }
                aria-label="Keep-in-touch rhythm"
                className="field w-auto py-1.5 text-callout"
              >
                {CADENCES.map((option) => (
                  <option key={option.label} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-caption text-fg-muted">
                {sinceLast === null
                  ? "Never logged a touchpoint"
                  : sinceLast === 0
                    ? "Last talked today"
                    : `Last talked ${sinceLast} ${sinceLast === 1 ? "day" : "days"} ago`}
              </span>
            </div>

            <LogTouchpoint contactId={contact.id} />
          </section>

          {birthdayIn !== null && birthdayIn <= 30 ? (
            <p className="flex items-center gap-2 rounded-xl border border-accent-dim bg-card-2 px-3 py-2 text-callout">
              <Cake size={15} strokeWidth={1.9} className="text-accent" />
              Birthday {birthdayIn === 0 ? "is today" : `in ${birthdayIn} days`}
              <span className="text-fg-muted">· {formatDate(contact.birthday)}</span>
            </p>
          ) : null}

          {contact.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contact.labels.map((l) => <span key={l} className="chip">{l}</span>)}
            </div>
          ) : null}

          <section>
            <h2 className="label mb-1.5">History</h2>
            <Timeline contactId={contact.id} />
          </section>

          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="label">Notes</h2>
              {savedFlash ? <span className="chip chip-on">Saved</span> : null}
            </div>
            {/* Edited in place and saved on blur; no round trip to a form page. */}
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              onBlur={commitNotes}
              rows={4}
              placeholder="Standing context: how you met, who they know, what they care about."
              className="field resize-y leading-relaxed"
            />
          </section>

          {details.length > 0 ? (
            <section>
              <h2 className="label mb-1.5">Details</h2>
              <dl className="overflow-hidden rounded-2xl border border-line bg-card">
                {details.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0"
                  >
                    <dt className="w-24 shrink-0 text-callout text-fg-muted">{item.label}</dt>
                    <dd className="min-w-0 flex-1 break-words text-body">
                      {item.label === "Email" ? (
                        <a href={`mailto:${item.value}`} className="text-accent underline-offset-2 hover:underline">
                          {item.value}
                        </a>
                      ) : item.label === "Phone" ? (
                        <a href={`tel:${item.value}`} className="text-accent underline-offset-2 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                    {item.label === "Email" || item.label === "Phone" ? (
                      <button
                        onClick={() => copy(item.label, item.value as string)}
                        aria-label={`Copy ${item.label.toLowerCase()}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-faint transition-colors hover:bg-card-2 hover:text-fg"
                      >
                        {copied === item.label ? (
                          <Check size={14} strokeWidth={2.2} className="text-accent" />
                        ) : (
                          <Copy size={14} strokeWidth={1.9} />
                        )}
                      </button>
                    ) : null}
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

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
