"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./auth";
import { identityKey, parseContacts } from "./parse";
import { seedContacts } from "./seed";
import { supabase } from "./supabase/client";
import { contactToRow, rowToContact, type ContactRow } from "./supabase/rows";
import type { Contact, ContactDraft, ImportResult } from "./types";

const LEGACY_STORAGE_KEY = "personal-crm/contacts/v1";
const TABLE = "rolodex_contacts";

type Store = {
  contacts: Contact[];
  /** False until the first fetch from Supabase has resolved. */
  ready: boolean;
  /** Set when a write fails (offline, network error). Cleared on the next successful write. */
  syncError: string | null;
  dismissSyncError: () => void;
  addContact: (draft: ContactDraft) => Contact;
  updateContact: (id: string, draft: ContactDraft) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  logContact: (id: string, on?: string) => void;
  /** Push a follow-up out by N days from today. */
  snooze: (id: string, days: number) => void;
  setFollowUp: (id: string, date?: string) => void;
  setNotes: (id: string, notes: string) => void;
  importText: (text: string) => ImportResult;
  replaceAll: (contacts: Contact[]) => void;
  clearAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

/** Fill in the derived name fields a draft may be missing. */
function materialize(draft: ContactDraft, existing?: Contact): Contact {
  const typedName = (draft.name ?? "").trim();
  const firstName = draft.firstName?.trim() || typedName.split(" ")[0] || "";
  const lastName =
    draft.lastName?.trim() || typedName.split(" ").slice(1).join(" ") || "";
  const name =
    typedName || [firstName, lastName].filter(Boolean).join(" ") || "Unnamed contact";

  return {
    ...draft,
    id: existing?.id ?? createId(),
    firstName,
    lastName,
    name,
    labels: draft.labels ?? [],
  };
}

export function isContactArray(value: unknown): value is Contact[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Contact).id === "string" &&
        typeof (item as Contact).name === "string",
    )
  );
}

/** Contacts saved locally before accounts existed, worth offering to import. */
function readLegacyLocalContacts(): Contact[] {
  try {
    const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!isContactArray(parsed)) return [];
    return parsed.filter((c) => c.source !== "sample");
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Guards against a slow fetch from an old user overwriting a new one's
  // freshly-loaded state if the signed-in account changes mid-flight.
  const loadToken = useRef(0);

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  // Initial load + one-time first-run provisioning (import local data, or
  // seed samples so a brand-new account is not an empty shell).
  useEffect(() => {
    if (!userId) {
      setContacts([]);
      setReady(false);
      return;
    }

    const token = ++loadToken.current;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled || token !== loadToken.current) return;

      if (error) {
        setSyncError(error.message);
        setContacts([]);
        setReady(true);
        return;
      }

      let rows = (data ?? []) as ContactRow[];

      if (rows.length === 0) {
        const legacy = readLegacyLocalContacts();
        const toSeed = legacy.length > 0 ? legacy : seedContacts();
        const { data: inserted, error: seedErr } = await supabase
          .from(TABLE)
          .insert(toSeed.map((c) => contactToRow(c, userId)))
          .select("*");
        if (cancelled || token !== loadToken.current) return;
        if (!seedErr && inserted) {
          rows = inserted as ContactRow[];
          if (legacy.length > 0) {
            // The imported copy now lives in the account; drop the local
            // one so it cannot be offered again or drift out of sync.
            try {
              window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch {
              // Not worth failing the load over.
            }
          }
        } else if (seedErr) {
          setSyncError(seedErr.message);
        }
      }

      setContacts(rows.map(rowToContact));
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Cross-device sync: a change made on another device (or another tab)
  // patches local state directly, no polling or manual refresh needed.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`rolodex_contacts:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: `user_id=eq.${userId}` },
        (payload) => {
          setContacts((previous) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as { id?: string }).id;
              return previous.filter((c) => c.id !== oldId);
            }
            const incoming = rowToContact(payload.new as ContactRow);
            const exists = previous.some((c) => c.id === incoming.id);
            return exists
              ? previous.map((c) => (c.id === incoming.id ? incoming : c))
              : [incoming, ...previous];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Apply a local update immediately, then persist it. On failure the local
   * state is rolled back to its pre-mutation snapshot and the error is
   * surfaced, so a write that didn't save is never silently treated as if
   * it had.
   */
  const commit = useCallback(
    async (
      apply: (previous: Contact[]) => Contact[],
      persist: () => Promise<{ error: { message: string } | null }>,
    ) => {
      let snapshot: Contact[] = [];
      setContacts((previous) => {
        snapshot = previous;
        return apply(previous);
      });
      const { error } = await persist();
      if (error) {
        setContacts(snapshot);
        setSyncError(error.message);
      } else {
        setSyncError(null);
      }
    },
    [],
  );

  const addContact = useCallback(
    (draft: ContactDraft) => {
      const contact = materialize(draft);
      if (userId) {
        void commit(
          (previous) => [contact, ...previous],
          async () => supabase.from(TABLE).insert(contactToRow(contact, userId)),
        );
      }
      return contact;
    },
    [userId, commit],
  );

  const updateContact = useCallback(
    (id: string, draft: ContactDraft) => {
      if (!userId) return;
      let updated: Contact | undefined;
      void commit(
        (previous) =>
          previous.map((contact) => {
            if (contact.id !== id) return contact;
            updated = materialize(draft, contact);
            return updated;
          }),
        async () =>
          supabase
            .from(TABLE)
            .update(contactToRow(updated ?? materialize(draft), userId))
            .eq("id", id),
      );
    },
    [userId, commit],
  );

  const deleteContact = useCallback(
    (id: string) => {
      if (!userId) return;
      void commit(
        (previous) => previous.filter((contact) => contact.id !== id),
        async () => supabase.from(TABLE).delete().eq("id", id),
      );
    },
    [userId, commit],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      if (!userId) return;
      let next = false;
      void commit(
        (previous) =>
          previous.map((contact) => {
            if (contact.id !== id) return contact;
            next = !contact.favorite;
            return { ...contact, favorite: next };
          }),
        async () => supabase.from(TABLE).update({ favorite: next }).eq("id", id),
      );
    },
    [userId, commit],
  );

  const logContact = useCallback(
    (id: string, on?: string) => {
      if (!userId) return;
      const when = on ?? new Date().toISOString().slice(0, 10);
      let nextHistory: string[] = [];
      void commit(
        (previous) =>
          previous.map((contact) => {
            if (contact.id !== id) return contact;
            const history = contact.history ?? [];
            nextHistory = history.includes(when) ? history : [...history, when];
            return { ...contact, lastContacted: when, history: nextHistory };
          }),
        async () =>
          supabase
            .from(TABLE)
            .update({ last_contacted: when, history: nextHistory })
            .eq("id", id),
      );
    },
    [userId, commit],
  );

  const snooze = useCallback(
    (id: string, days: number) => {
      if (!userId) return;
      const target = new Date();
      target.setDate(target.getDate() + days);
      const when = `${target.getFullYear()}-${`${target.getMonth() + 1}`.padStart(2, "0")}-${`${target.getDate()}`.padStart(2, "0")}`;
      void commit(
        (previous) =>
          previous.map((contact) =>
            contact.id === id ? { ...contact, nextFollowUp: when } : contact,
          ),
        async () => supabase.from(TABLE).update({ next_follow_up: when }).eq("id", id),
      );
    },
    [userId, commit],
  );

  const setFollowUp = useCallback(
    (id: string, date?: string) => {
      if (!userId) return;
      void commit(
        (previous) =>
          previous.map((contact) =>
            contact.id === id ? { ...contact, nextFollowUp: date || undefined } : contact,
          ),
        async () =>
          supabase
            .from(TABLE)
            .update({ next_follow_up: date || null })
            .eq("id", id),
      );
    },
    [userId, commit],
  );

  const setNotes = useCallback(
    (id: string, notes: string) => {
      if (!userId) return;
      const trimmed = notes.trim() || undefined;
      void commit(
        (previous) =>
          previous.map((contact) => (contact.id === id ? { ...contact, notes: trimmed } : contact)),
        async () => supabase.from(TABLE).update({ notes: trimmed ?? null }).eq("id", id),
      );
    },
    [userId, commit],
  );

  const importText = useCallback(
    (text: string): ImportResult => {
      const drafts = parseContacts(text);
      let result: ImportResult = { added: 0, skipped: 0 };
      if (!userId) return result;

      let fresh: Contact[] = [];
      void commit(
        (previous) => {
          // Match against existing emails and phones so re-importing the
          // same export does not duplicate anyone.
          const seen = new Set(
            previous.flatMap((contact) =>
              [identityKey(contact.email), identityKey(contact.phone)].filter(Boolean),
            ),
          );

          fresh = [];
          for (const draft of drafts) {
            const contact = materialize(draft);
            const keys = [identityKey(contact.email), identityKey(contact.phone)].filter(
              Boolean,
            );
            // With no email or phone there is nothing to dedupe on, so keep it.
            if (keys.some((key) => seen.has(key))) continue;
            keys.forEach((key) => seen.add(key));
            fresh.push(contact);
          }

          result = { added: fresh.length, skipped: drafts.length - fresh.length };
          return [...fresh, ...previous];
        },
        async () => {
          if (fresh.length === 0) return { error: null };
          return supabase.from(TABLE).insert(fresh.map((c) => contactToRow(c, userId)));
        },
      );

      return result;
    },
    [userId, commit],
  );

  const replaceAll = useCallback(
    (next: Contact[]) => {
      if (!userId) return;
      void commit(
        () => next,
        async () => {
          // Restoring a backup replaces the whole set: clear this
          // account's rows, then insert the restored ones.
          const del = await supabase.from(TABLE).delete().eq("user_id", userId);
          if (del.error) return del;
          if (next.length === 0) return { error: null };
          return supabase.from(TABLE).insert(next.map((c) => contactToRow(c, userId)));
        },
      );
    },
    [userId, commit],
  );

  const clearAll = useCallback(() => {
    if (!userId) return;
    void commit(
      () => [],
      async () => supabase.from(TABLE).delete().eq("user_id", userId),
    );
  }, [userId, commit]);

  const value = useMemo<Store>(
    () => ({
      contacts,
      ready,
      syncError,
      dismissSyncError,
      addContact,
      updateContact,
      deleteContact,
      toggleFavorite,
      logContact,
      snooze,
      setFollowUp,
      setNotes,
      importText,
      replaceAll,
      clearAll,
    }),
    [
      contacts,
      ready,
      syncError,
      dismissSyncError,
      addContact,
      updateContact,
      deleteContact,
      toggleFavorite,
      logContact,
      snooze,
      setFollowUp,
      setNotes,
      importText,
      replaceAll,
      clearAll,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}

export function useContact(id: string): Contact | undefined {
  const { contacts } = useStore();
  return contacts.find((contact) => contact.id === id);
}
