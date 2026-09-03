import { getInitials } from "@/lib/format";
import type { Contact } from "@/lib/types";

const SIZES = {
  sm: "h-8 w-8 text-[0.7rem]",
  md: "h-10 w-10 text-[0.8rem]",
} as const;

/**
 * Monogram standing in for a contact photo. Deliberately neutral: colour in
 * this app is reserved for follow-up state, so plates carry none of it.
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
