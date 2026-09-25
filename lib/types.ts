export type ContactSource = "sample" | "import" | "manual";

/** How a touchpoint happened. `note` is the catch-all for "just recording this". */
export type Channel = "call" | "message" | "email" | "meeting" | "note";

export const CHANNELS: { value: Channel; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "message", label: "Message" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

export type Interaction = {
  id: string;
  contactId: string;
  /** `YYYY-MM-DD`. The day it happened, not the day it was typed in. */
  happenedOn: string;
  channel: Channel;
  note?: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  notes?: string;
  labels: string[];
  lastContacted?: string;
  nextFollowUp?: string;
  source: ContactSource;
  favorite?: boolean;
  /** Dates you logged contact, oldest first. Drives the activity chart. */
  history?: string[];
  /**
   * Keep-in-touch rhythm in days. When set, logging a touchpoint schedules the
   * next follow-up automatically, so a relationship cannot quietly lapse.
   */
  cadenceDays?: number;
  /** The single line describing what you owe this person next. */
  nextStep?: string;
};

/** A contact before it has an id or a resolved display name. */
export type ContactDraft = Omit<Contact, "id" | "name"> & { name?: string };

export type ImportResult = { added: number; skipped: number };

/** Cadence presets. `undefined` means no rhythm — follow-ups stay manual. */
export const CADENCES: { value: number | undefined; label: string; short: string }[] = [
  { value: undefined, label: "No set rhythm", short: "Manual" },
  { value: 14, label: "Every 2 weeks", short: "2w" },
  { value: 30, label: "Every month", short: "1m" },
  { value: 90, label: "Every quarter", short: "3m" },
  { value: 180, label: "Twice a year", short: "6m" },
  { value: 365, label: "Once a year", short: "1y" },
];
