import ContactRow from "./ContactRow";
import type { Contact } from "@/lib/types";

export default function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <ul className="rounded-xl border border-rule bg-white/60 px-4">
      {contacts.map((contact, index) => (
        <ContactRow key={contact.id} contact={contact} index={index} />
      ))}
    </ul>
  );
}
