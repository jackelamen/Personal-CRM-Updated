"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { identityKey, parseContacts } from "./parse";
import { seedContacts } from "./seed";
import type { Contact, ContactDraft, ImportResult } from "./types";

const STORAGE_KEY = "personal-crm/contacts/v1";

type Store = {
  contacts: Contact[];
  /** False during the first client render, before localStorage has been read. */
  ready: boolean;
  addContact: (draft: ContactDraft) => Contact;
  updateContact: (id: string, draft: ContactDraft) => void;
  deleteContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  logContact: (id: string, on?: string) => void;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [ready, setReady] = useState(false);

  // Read once on mount. Rendering the same empty list on server and first
  // client render keeps hydration stable; real data arrives right after.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        setContacts(isContactArray(parsed) ? parsed : seedContacts());
      } else {
        setContacts(seedContacts());
      }
    } catch {
      setContacts(seedContacts());
    }
    setReady(true);
  }, []);

  // Persist every change. Skipped until the initial read has finished, so an
  // empty starting state can never overwrite saved contacts.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      // Storage full or blocked (private browsing). The app still works for
      // this session; there is nothing useful to recover here.
    }
  }, [contacts, ready]);

  const addContact = useCallback((draft: ContactDraft) => {
    const contact = materialize(draft);
    setContacts((previous) => [contact, ...previous]);
    return contact;
  }, []);

  const updateContact = useCallback((id: string, draft: ContactDraft) => {
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === id ? materialize(draft, contact) : contact,
      ),
    );
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContacts((previous) => previous.filter((contact) => contact.id !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === id ? { ...contact, favorite: !contact.favorite } : contact,
      ),
    );
  }, []);

  const logContact = useCallback((id: string, on?: string) => {
    const when = on ?? new Date().toISOString().slice(0, 10);
    setContacts((previous) =>
      previous.map((contact) =>
        contact.id === id ? { ...contact, lastContacted: when } : contact,
      ),
    );
  }, []);

  const importText = useCallback((text: string): ImportResult => {
    const drafts = parseContacts(text);
    let result: ImportResult = { added: 0, skipped: 0 };

    setContacts((previous) => {
      // Match against existing emails and phones so re-importing the same
      // export does not duplicate anyone.
      const seen = new Set(
        previous.flatMap((contact) =>
          [identityKey(contact.email), identityKey(contact.phone)].filter(Boolean),
        ),
      );

      const fresh: Contact[] = [];
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
    });

    return result;
  }, []);

  const replaceAll = useCallback((next: Contact[]) => setContacts(next), []);
  const clearAll = useCallback(() => setContacts([]), []);

  const value = useMemo<Store>(
    () => ({
      contacts,
      ready,
      addContact,
      updateContact,
      deleteContact,
      toggleFavorite,
      logContact,
      importText,
      replaceAll,
      clearAll,
    }),
    [
      contacts,
      ready,
      addContact,
      updateContact,
      deleteContact,
      toggleFavorite,
      logContact,
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
