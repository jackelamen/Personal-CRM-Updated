import { avatarTone, getInitials } from "@/lib/format";
import type { Contact } from "@/lib/types";

const SIZES = {
  sm: "h-9 w-9 text-caption",
  md: "h-11 w-11 text-body",
  lg: "h-14 w-14 text-title",
} as const;

const TONE = {
  1: "bg-c1",
  2: "bg-c2",
  3: "bg-c3",
  4: "bg-c4",
} as const;

export default function Avatar({
  contact,
  size = "md",
  ring,
}: {
  contact: Pick<Contact, "id" | "name" | "firstName" | "lastName">;
  size?: keyof typeof SIZES;
  /** Red ring marks an overdue follow-up, alongside the text chip. */
  ring?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`plate ${TONE[avatarTone(contact.id)]} ${SIZES[size]} ${
        ring ? "ring-2 ring-danger ring-offset-2 ring-offset-card" : ""
      }`}
    >
      {getInitials(contact)}
    </span>
  );
}
