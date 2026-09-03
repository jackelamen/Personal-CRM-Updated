"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { useStore } from "@/lib/store";

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { contacts, ready, updateContact } = useStore();

  const contact = contacts.find((item) => item.id === params.id);

  if (!ready) return <div className="h-64" aria-hidden />;

  if (!contact) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Contact not found</p>
        <Link href="/people" className="btn btn-quiet mt-6">
          Back to people
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="eyebrow">Editing</p>
        <h1 className="font-display mt-1 text-4xl font-semibold tracking-tight text-ink">
          {contact.name}
        </h1>
      </div>

      <ContactForm
        initial={contact}
        submitLabel="Save changes"
        cancelHref={`/people/${contact.id}`}
        onSubmit={(draft) => {
          updateContact(contact.id, draft);
          router.push(`/people/${contact.id}`);
        }}
      />
    </div>
  );
}
