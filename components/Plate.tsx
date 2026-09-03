import { getInitials } from "@/lib/format";
import type { Contact } from "@/lib/types";

const SIZES = {
  sm: "h-9 w-9 text-[0.78rem]",
  md: "h-11 w-11 text-[0.9rem]",
  lg: "h-16 w-16 text-2xl",
} as const;

/**
 * The monogram tile standing in for a contact photo. Every plate looks the
 * same on purpose: colour on this app is reserved for follow-up state, so
 * tinting plates per person would spend the signal on decoration.
 */
export default function Plate({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "id" | "name" | "firstName" | "lastName">;
  size?: keyof typeof SIZES;
}) {
  return (
    <span aria-hidden className={`plate ${SIZES[size]}`}>
      {getInitials(contact)}
    </span>
  );
}
