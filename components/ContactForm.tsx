"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isLabeledText, parseLabeledText, parseVCard } from "@/lib/parse";
import type { Contact, ContactDraft } from "@/lib/types";

type Props = {
  initial?: Contact;
  submitLabel: string;
  onSubmit: (draft: ContactDraft) => void;
  cancelHref: string;
  /** Only offered on the new-contact form, where there is nothing to overwrite. */
  allowVCardImport?: boolean;
};

/** Shared by the new-contact and edit-contact pages. */
export default function ContactForm({
  initial,
  submitLabel,
  onSubmit,
  cancelHref,
  allowVCardImport,
}: Props) {
  const [values, setValues] = useState({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    role: initial?.role ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    birthday: initial?.birthday ?? "",
    labels: initial?.labels.join(", ") ?? "",
    notes: initial?.notes ?? "",
    lastContacted: initial?.lastContacted ?? "",
    nextFollowUp: initial?.nextFollowUp ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [vcardError, setVcardError] = useState<string | null>(null);
  const [vcardText, setVcardText] = useState("");
  const [showVCardPaste, setShowVCardPaste] = useState(false);
  const vcardInput = useRef<HTMLInputElement>(null);

  const applyVCardText = (text: string) => {
    const draft = /BEGIN:VCARD/i.test(text)
      ? parseVCard(text)[0]
      : isLabeledText(text)
        ? parseLabeledText(text) ?? undefined
        : undefined;
    if (!draft) {
      setVcardError(
        "Couldn't read that. Paste a vCard (BEGIN:VCARD…) or lines like \"[Name] ...\", \"[Mobile] ...\".",
      );
      return;
    }
    setVcardError(null);
    setError(null);
    setValues({
      name: draft.name ?? "",
      company: draft.company ?? "",
      role: draft.role ?? "",
      email: draft.email ?? "",
      phone: draft.phone ?? "",
      birthday: draft.birthday ?? "",
      labels: draft.labels?.join(", ") ?? "",
      notes: draft.notes ?? "",
      lastContacted: "",
      nextFollowUp: "",
    });
  };

  const handleVCardFile = (file: File) => {
    file.text().then(applyVCardText).catch(() => setVcardError("That file could not be read."));
  };

  const set = (key: keyof typeof values) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((previous) => ({ ...previous, [key]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const name = values.name.trim();
    if (!name) {
      setError("A name is required.");
      return;
    }

    const trimmed = (value: string) => {
      const result = value.trim();
      return result === "" ? undefined : result;
    };

    onSubmit({
      name,
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      company: trimmed(values.company),
      role: trimmed(values.role),
      email: trimmed(values.email),
      phone: trimmed(values.phone),
      birthday: trimmed(values.birthday),
      notes: trimmed(values.notes),
      lastContacted: trimmed(values.lastContacted),
      nextFollowUp: trimmed(values.nextFollowUp),
      labels: values.labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
      source: initial?.source ?? "manual",
      favorite: initial?.favorite,
    });
  };

  const text = (
    key: keyof typeof values,
    label: string,
    type = "text",
    placeholder?: string,
  ) => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        value={values[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className="field mt-1"
      />
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {allowVCardImport ? (
        <div className="card-2 space-y-3 rounded-xl p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={vcardInput}
              type="file"
              accept=".vcf,text/vcard"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleVCardFile(file);
                event.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => vcardInput.current?.click()}
              className="btn btn-quiet"
            >
              Load a vCard (.vcf)
            </button>
            <button
              type="button"
              onClick={() => setShowVCardPaste((previous) => !previous)}
              className="btn btn-quiet"
            >
              {showVCardPaste ? "Hide paste box" : "Paste contact text"}
            </button>
          </div>
          <p className="text-caption text-fg-muted">
            Fills in the fields below, which you can still edit before saving.
          </p>

          {showVCardPaste ? (
            <div className="space-y-2">
              <textarea
                value={vcardText}
                onChange={(event) => setVcardText(event.target.value)}
                rows={5}
                placeholder={
                  "Paste a BEGIN:VCARD…END:VCARD block, or lines like:\n[Name] Jungwoo Song (지안's Dad)\n[Mobile] 010-9322-9690"
                }
                className="field resize-y font-mono text-caption leading-relaxed"
              />
              <button
                type="button"
                onClick={() => applyVCardText(vcardText)}
                className="btn btn-quiet"
              >
                Fill in from pasted text
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      {vcardError ? <p className="text-sm font-semibold text-danger">{vcardError}</p> : null}

      <label className="block">
        <span className="label">Name</span>
        <input
          value={values.name}
          onChange={set("name")}
          placeholder="Maya Chen"
          aria-invalid={Boolean(error)}
          className="field mt-1"
        />
      </label>
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {text("company", "Company", "text", "Northstar Studio")}
        {text("role", "Role", "text", "Creative Director")}
        {text("email", "Email", "email", "maya@example.com")}
        {text("phone", "Phone", "tel", "+1 415 555 0182")}
        {text("birthday", "Birthday", "date")}
        {text("labels", "Labels", "text", "Design, Local")}
        {text("lastContacted", "Last contacted", "date")}
        {text("nextFollowUp", "Next follow-up", "date")}
      </div>

      <label className="block">
        <span className="label">Notes</span>
        <textarea
          value={values.notes}
          onChange={set("notes")}
          rows={5}
          placeholder="What do you want to remember about this person?"
          className="field mt-1 resize-y leading-relaxed"
        />
      </label>

      <div className="flex flex-wrap gap-2 pt-2">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <Link href={cancelHref} className="btn btn-quiet">
          Cancel
        </Link>
      </div>
    </form>
  );
}
