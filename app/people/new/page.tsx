"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { BackIcon } from "@/components/Icons";
import { useStore } from "@/lib/store";

export default function NewContactPage() {
  const router = useRouter();
  const { addContact } = useStore();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="toolbar flex items-center gap-2 px-3 py-2">
        <Link href="/people" aria-label="Back" className="btn btn-ghost px-1.5">
          <BackIcon className="h-[18px] w-[18px]" />
        </Link>
        <h1 className="text-[0.9rem] font-semibold">New contact</h1>
      </div>
      <div className="pane flex-1">
        <div className="mx-auto max-w-2xl p-4">
          <ContactForm
            submitLabel="Save contact"
            cancelHref="/people"
            onSubmit={(draft) => router.push(`/people/${addContact(draft).id}`)}
          />
        </div>
      </div>
    </div>
  );
}
