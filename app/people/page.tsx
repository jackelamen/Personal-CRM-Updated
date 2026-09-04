"use client";

import { Users } from "lucide-react";

/** Right pane placeholder on desktop; on mobile the list occupies the screen. */
export default function PeopleIndexPage() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 text-fg-faint lg:flex">
      <Users size={28} strokeWidth={1.75} />
      <p className="text-body">Select someone to see their details.</p>
    </div>
  );
}
