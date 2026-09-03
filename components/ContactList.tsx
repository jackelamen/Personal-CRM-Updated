import ContactRow from "./ContactRow";
import type { Contact } from "@/lib/types";

export default function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="rounded-lg border border-rule bg-card px-4">
      {contacts.map((contact) => (
        <ContactRow key={contact.id} contact={contact} />
      ))}
    </ul>
  );
}
