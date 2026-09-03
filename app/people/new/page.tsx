"use client";

import { useRouter } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { useStore } from "@/lib/store";

export default function NewContactPage() {
  const router = useRouter();
  const { addContact } = useStore();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="eyebrow">New entry</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-ink">
          Add a contact
        </h1>
      </div>

      <ContactForm
        submitLabel="Save contact"
        cancelHref="/people"
        onSubmit={(draft) => {
          const contact = addContact(draft);
          router.push(`/people/${contact.id}`);
        }}
      />
    </div>
  );
}
