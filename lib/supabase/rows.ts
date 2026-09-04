import type { Contact, ContactDraft, ContactSource } from "../types";

/** Shape of a row in public.rolodex_contacts, as returned by supabase-js. */
export type ContactRow = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  notes: string | null;
  labels: string[];
  last_contacted: string | null;
  next_follow_up: string | null;
  history: string[];
  source: string;
  favorite: boolean;
};

export function rowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.name,
    company: row.company ?? undefined,
    role: row.role ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    birthday: row.birthday ?? undefined,
    notes: row.notes ?? undefined,
    labels: row.labels ?? [],
    lastContacted: row.last_contacted ?? undefined,
    nextFollowUp: row.next_follow_up ?? undefined,
    history: row.history ?? undefined,
    source: (row.source as ContactSource) ?? "manual",
    favorite: row.favorite,
  };
}

/** Fields insertable/updatable for a given user; id and timestamps are server-owned. */
export function contactToRow(
  contact: Contact | (ContactDraft & { id?: string }),
  userId: string,
) {
  return {
    ...("id" in contact && contact.id ? { id: contact.id } : {}),
    user_id: userId,
    first_name: contact.firstName ?? "",
    last_name: contact.lastName ?? "",
    name: contact.name ?? "",
    company: contact.company ?? null,
    role: contact.role ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    birthday: contact.birthday ?? null,
    notes: contact.notes ?? null,
    labels: contact.labels ?? [],
    last_contacted: contact.lastContacted ?? null,
    next_follow_up: contact.nextFollowUp ?? null,
    history: contact.history ?? [],
    source: contact.source ?? "manual",
    favorite: contact.favorite ?? false,
  };
}
