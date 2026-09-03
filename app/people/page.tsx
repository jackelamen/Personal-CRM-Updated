"use client";

import { PeopleIcon } from "@/components/Icons";

/** Right pane placeholder on desktop; on mobile the list occupies the screen. */
export default function PeopleIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 text-fg-faint lg:flex">
      <PeopleIcon className="h-7 w-7" />
      <p className="text-[0.82rem]">Select someone to see their details.</p>
    </div>
  );
}
