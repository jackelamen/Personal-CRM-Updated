"use client";

import { useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { isContactArray } from "@/lib/store";
import { supabase } from "@/lib/supabase/client";
import type { ImportResult } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export default function ImportPage() {
  const { session } = useAuth();
  const { contacts, ready, importText, replaceAll, clearAll } = useStore();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [confirmingClear, setConfirmingClear] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  const describe = (result: ImportResult) => {
    if (result.added === 0 && result.skipped === 0) {
      return "No contacts found. Check that the file is a Google Contacts CSV or a .vcf export.";
    }
    const added = `Added ${result.added} ${result.added === 1 ? "contact" : "contacts"}`;
    return result.skipped > 0
      ? `${added}. Skipped ${result.skipped} already in your list.`
      : `${added}.`;
  };

  const runImport = (raw: string) => {
    if (!raw.trim()) {
      setStatus({ kind: "error", message: "Nothing to import yet." });
      return;
    }
    try {
      setStatus({ kind: "ok", message: describe(importText(raw)) });
      setText("");
    } catch {
      setStatus({ kind: "error", message: "That file could not be read." });
    }
  };

  const readFile = (file: File, onText: (value: string) => void) => {
    file
      .text()
      .then(onText)
      .catch(() => setStatus({ kind: "error", message: "That file could not be read." }));
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rolodex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restore = (raw: string) => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isContactArray(parsed)) {
        setStatus({ kind: "error", message: "That is not a Rolodex backup file." });
        return;
      }
      replaceAll(parsed);
      setStatus({
        kind: "ok",
        message: `Restored ${parsed.length} ${parsed.length === 1 ? "contact" : "contacts"}.`,
      });
    } catch {
      setStatus({ kind: "error", message: "That backup could not be read." });
    }
  };

  if (!ready) return <div className="h-64" aria-hidden />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="appbar glass px-4 py-2.5">
        <h1 className="text-headline font-semibold">Import &amp; data</h1>
      </div>
      <div className="pane flex-1">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
      <div>
        <h1 className="text-headline font-semibold">Import &amp; data</h1>
        <p className="mt-1 text-body leading-relaxed text-fg-muted">
          Export your contacts from Google Contacts as a CSV or vCard, then drop the
          file in below. Anyone whose email or phone already appears in your list is
          skipped, so importing twice is safe.
        </p>
      </div>

      <section className="card flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="label">Signed in as</p>
          <p className="truncate text-body font-semibold">{session?.user.email}</p>
          <p className="mt-0.5 text-caption text-fg-muted">
            Your contacts sync to this account across every device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="btn btn-quiet"
        >
          <LogOut size={15} strokeWidth={1.9} />
          Sign out
        </button>
      </section>

      {status.kind !== "idle" ? (
        <p
          role="status"
          className={`rounded-xl border px-3 py-2 text-callout font-medium ${
            status.kind === "ok"
              ? "border-accent-dim bg-card-2 text-accent"
              : "border-danger-dim bg-danger-wash text-danger"
          }`}
        >
          {status.message}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="label">From a file</h2>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,.vcf,text/csv,text/vcard"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readFile(file, runImport);
            event.target.value = "";
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="btn btn-primary"
        >
          Choose CSV or vCard
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="label">Or paste the contents</h2>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          placeholder="Paste CSV rows or a BEGIN:VCARD block…"
          className="field resize-y font-mono text-caption leading-relaxed"
        />
        <button type="button" onClick={() => runImport(text)} className="btn btn-quiet">
          Import pasted text
        </button>
      </section>

      <section className="space-y-3 border-t border-line pt-5">
        <h2 className="label">Backup</h2>
        <p className="text-body leading-relaxed text-fg-muted">
          Your contacts already sync to your account. A backup is still worth keeping
          as an independent copy you control.
        </p>
        <input
          ref={backupInput}
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) readFile(file, restore);
            event.target.value = "";
          }}
          className="hidden"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            disabled={contacts.length === 0}
            className="btn btn-quiet disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download backup ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => backupInput.current?.click()}
            className="btn btn-quiet"
          >
            Restore from backup
          </button>
        </div>
      </section>

      <section className="space-y-3 border-t border-line pt-5">
        <h2 className="label">Danger zone</h2>
        {confirmingClear ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-body text-fg">
              Delete all {contacts.length} contacts from your account? This removes
              them everywhere they have synced.
            </p>
            <button
              type="button"
              onClick={() => {
                clearAll();
                setConfirmingClear(false);
                setStatus({ kind: "ok", message: "All contacts removed." });
              }}
              className="btn btn-primary"
            >
              Yes, delete everything
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={contacts.length === 0}
            className="btn btn-danger disabled:cursor-not-allowed disabled:opacity-40"
          >
            Remove all contacts
          </button>
        )}
      </section>
      </div>
      </div>
    </div>
  );
}
