export type ContactSource = "sample" | "import" | "manual";

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
};

/** A contact before it has an id or a resolved display name. */
export type ContactDraft = Omit<Contact, "id" | "name"> & { name?: string };

export type ImportResult = { added: number; skipped: number };
