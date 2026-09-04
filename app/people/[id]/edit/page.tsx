"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { contacts, ready, updateContact } = useStore();
  const contact = contacts.find((item) => item.id === params.id);

  if (!ready) return null;

  if (!contact) {
    return (
      <div className="flex h-full items-center justify-center">
        <Link href="/people" className="btn btn-quiet">Back to people</Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="appbar glass flex items-center gap-2 px-3 py-2">
        <Link href={`/people/${contact.id}`} aria-label="Back" className="icon-circle shrink-0">
          <ChevronLeft size={18} strokeWidth={1.75} />
        </Link>
        <h1 className="truncate text-headline font-semibold">Edit {contact.name}</h1>
      </div>
      <div className="pane flex-1">
        <div className="mx-auto max-w-2xl p-4">
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
      </div>
    </div>
  );
}
