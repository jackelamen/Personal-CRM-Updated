"use client";

import { useMemo, useState } from "react";
import { Check, Mail, MessageSquare, Phone, StickyNote, Trash2, Users2 } from "lucide-react";
import { formatDate, formatRelativeDay, todayInputDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import { CHANNELS, type Channel } from "@/lib/types";

const CHANNEL_ICON: Record<Channel, typeof Phone> = {
  call: Phone,
  message: MessageSquare,
  email: Mail,
  meeting: Users2,
  note: StickyNote,
};

/**
 * Records what actually happened, not just that something did. Defaults to a
 * call today, because that is the common case and it should be two taps.
 */
export function LogTouchpoint({ contactId }: { contactId: string }) {
  const { logInteraction, contacts } = useStore();
  const contact = contacts.find((c) => c.id === contactId);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("call");
  const [happenedOn, setHappenedOn] = useState(todayInputDate());
  const [note, setNote] = useState("");

  const save = () => {
    logInteraction({ contactId, happenedOn, channel, note });
    setNote("");
    setHappenedOn(todayInputDate());
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary w-full">
        <Check size={16} strokeWidth={1.9} />
        Log a touchpoint
      </button>
    );
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-line bg-card-2 p-3">
      <div className="flex flex-wrap gap-1.5">
        {CHANNELS.map((option) => {
          const Icon = CHANNEL_ICON[option.value];
          return (
            <button
              key={option.value}
              onClick={() => setChannel(option.value)}
              aria-pressed={channel === option.value}
              className={`chip ${channel === option.value ? "chip-on" : ""}`}
            >
              <Icon size={13} strokeWidth={1.9} />
              {option.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        autoFocus
        placeholder="What came out of it? Any commitment, and who owes what."
        className="field resize-y leading-relaxed"
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className="sr-only">Date it happened</span>
          <input
            type="date"
            value={happenedOn}
            max={todayInputDate()}
            onChange={(e) => setHappenedOn(e.target.value)}
            aria-label="Date it happened"
            className="field w-[8.75rem] py-1.5 text-callout"
          />
        </label>
        <button onClick={save} className="btn btn-primary flex-1">
          Save touchpoint
        </button>
        <button onClick={() => setOpen(false)} className="btn btn-ghost">
          Cancel
        </button>
      </div>

      {contact?.cadenceDays ? (
        <p className="text-caption text-fg-muted">
          Saving books the next follow-up {contact.cadenceDays} days out, per this
          person&apos;s rhythm.
        </p>
      ) : null}
    </div>
  );
}

/** Everything that has happened with this person, newest first. */
export function Timeline({ contactId }: { contactId: string }) {
  const { interactions, deleteInteraction, contacts } = useStore();
  const contact = contacts.find((c) => c.id === contactId);

  const mine = useMemo(
    () =>
      interactions
        .filter((i) => i.contactId === contactId)
        .sort((a, b) => b.happenedOn.localeCompare(a.happenedOn)),
    [interactions, contactId],
  );

  // Dates logged before touchpoints carried notes still deserve to show up.
  const legacyOnly = useMemo(() => {
    const logged = new Set(mine.map((i) => i.happenedOn));
    return (contact?.history ?? []).filter((d) => !logged.has(d)).sort().reverse();
  }, [contact?.history, mine]);

  if (mine.length === 0 && legacyOnly.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-callout text-fg-muted">
        No touchpoints logged yet. The first one starts the history.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {mine.map((entry) => {
        const Icon = CHANNEL_ICON[entry.channel];
        return (
          <li key={entry.id} className="flex gap-2.5 rounded-xl border border-line bg-card p-3">
            <span className="icon-chip mt-0.5 shrink-0 bg-card-2 text-accent">
              <Icon size={15} strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2 text-callout">
                <span className="font-semibold capitalize text-fg">{entry.channel}</span>
                <time className="text-fg-muted">{formatDate(entry.happenedOn)}</time>
                <span className="text-fg-faint">{formatRelativeDay(entry.happenedOn)}</span>
              </p>
              {entry.note ? (
                <p className="mt-1 whitespace-pre-wrap break-words text-body leading-relaxed">
                  {entry.note}
                </p>
              ) : null}
            </div>
            <button
              onClick={() => deleteInteraction(entry.id)}
              aria-label={`Delete the ${entry.channel} logged on ${formatDate(entry.happenedOn)}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-fg-faint transition-colors hover:bg-card-2 hover:text-danger"
            >
              <Trash2 size={14} strokeWidth={1.9} />
            </button>
          </li>
        );
      })}

      {legacyOnly.map((date) => (
        <li
          key={`legacy-${date}`}
          className="flex items-baseline gap-2 rounded-xl border border-line px-3 py-2 text-callout text-fg-muted"
        >
          <time className="text-fg">{formatDate(date)}</time>
          <span>contacted</span>
          <span className="text-fg-faint">{formatRelativeDay(date)}</span>
        </li>
      ))}
    </ol>
  );
}
