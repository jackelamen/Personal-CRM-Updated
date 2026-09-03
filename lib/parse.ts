import type { ContactDraft } from "./types";

/** Unescape the RFC 6350 character escapes used in vCard values. */
function unescape(value?: string): string {
  return (value ?? "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Reduce an email or phone to a comparable key, ignoring formatting. */
export function identityKey(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isUsable(draft: ContactDraft): boolean {
  return Boolean(draft.name?.trim() || draft.email || draft.phone);
}

// -- vCard ------------------------------------------------------------------

type Property = { key: string; value: string };

function parseProperty(line: string): Property {
  const colon = line.indexOf(":");
  if (colon < 0) return { key: line.toUpperCase(), value: "" };
  // Strip any parameters: `EMAIL;TYPE=HOME:a@b.c` -> key `EMAIL`.
  const key = line.slice(0, colon).split(";")[0].toUpperCase();
  return { key, value: unescape(line.slice(colon + 1)) };
}

export function parseVCard(text: string): ContactDraft[] {
  // Unfold continuation lines, which begin with a space or tab.
  const unfolded = text.replace(/\r?\n[ \t]/g, "");

  return unfolded
    .split(/BEGIN:VCARD/i)
    .slice(1)
    .map((block) => {
      const properties = block
        .split(/END:VCARD/i)[0]
        .split(/\r?\n/)
        .filter(Boolean)
        .map(parseProperty);

      const get = (key: string) => properties.find((p) => p.key === key)?.value || undefined;

      // N is `family;given;middle;prefix;suffix`.
      const nameParts = (get("N") ?? "").split(";");
      const firstName = nameParts[1]?.trim() ?? "";
      const lastName = nameParts[0]?.trim() ?? "";

      return {
        firstName,
        lastName,
        name: get("FN") || [firstName, lastName].filter(Boolean).join(" "),
        company: get("ORG")?.split(";")[0],
        role: get("TITLE"),
        email: get("EMAIL"),
        phone: get("TEL"),
        birthday: get("BDAY"),
        notes: get("NOTE"),
        labels: (get("CATEGORIES") ?? "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
        source: "import" as const,
      };
    })
    .filter(isUsable);
}

// -- CSV --------------------------------------------------------------------

/** Split one CSV row, honouring quoted cells and doubled escape quotes. */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Split a CSV document into rows, keeping newlines that sit inside quotes. */
function splitCsvRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') {
      current += '""';
      i += 1;
      continue;
    }
    if (char === '"') quoted = !quoted;

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      rows.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  rows.push(current);
  return rows.filter((row) => row.trim());
}

export function parseCsv(text: string): ContactDraft[] {
  const rows = splitCsvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return [];

  const headers = splitCsvLine(rows[0]).map((header) => header.toLowerCase());

  return rows
    .slice(1)
    .map((row) => {
      const cells = splitCsvLine(row);
      // Google Contacts column names vary by export; match on any known label.
      const find = (needles: string[]) => {
        const index = headers.findIndex((header) =>
          needles.some((needle) => header.includes(needle)),
        );
        return index >= 0 ? cells[index] || undefined : undefined;
      };

      const firstName = find(["first name", "given name"]) ?? "";
      const lastName = find(["last name", "family name"]) ?? "";

      return {
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(" ") || find(["name"]) || "",
        company: find(["organization 1 - name", "organization name", "company"]),
        role: find(["organization 1 - title", "organization title", "job title"]),
        email: find(["e-mail 1 - value", "email 1 - value", "e-mail", "email"]),
        phone: find(["phone 1 - value", "phone"]),
        birthday: find(["birthday"]),
        notes: find(["notes", "note"]),
        labels: (find(["labels", "group membership"]) ?? "")
          .split(/[,:]/)
          .map((label) => label.replace(/^\s*\*\s*/, "").trim())
          .filter((label) => label && !/^my contacts$/i.test(label)),
        source: "import" as const,
      };
    })
    .filter(isUsable);
}

/** Detect the format and parse. Accepts Google Contacts CSV or vCard (.vcf). */
export function parseContacts(text: string): ContactDraft[] {
  return /BEGIN:VCARD/i.test(text) ? parseVCard(text) : parseCsv(text);
}
