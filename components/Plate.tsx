import { getInitials, plateTone } from "@/lib/format";
import type { Contact } from "@/lib/types";

const SIZES = {
  sm: "h-9 w-9 text-[0.8rem]",
  md: "h-11 w-11 text-[0.95rem]",
  lg: "h-16 w-16 text-2xl",
} as const;

/** The monogram tile that stands in for a contact photo. */
export default function Plate({
  contact,
  size = "md",
}: {
  contact: Pick<Contact, "id" | "name" | "firstName" | "lastName">;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      aria-hidden
      className={`plate plate-${plateTone(contact.id)} ${SIZES[size]}`}
    >
      {getInitials(contact)}
    </span>
  );
}
