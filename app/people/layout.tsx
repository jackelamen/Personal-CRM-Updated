"use client";

import { useParams } from "next/navigation";
import PeopleListPane from "@/components/PeopleListPane";

/**
 * Master-detail. On desktop both panes are visible at once. On mobile only
 * one is: the list until you pick someone, then the detail, which is what a
 * native app does rather than pushing a whole new page.
 */
export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const hasSelection = Boolean(params?.id);

  return (
    <div className="flex h-full min-h-0">
      <div
        className={`${
          hasSelection ? "hidden lg:flex" : "flex"
        } w-full min-w-0 shrink-0 flex-col border-line lg:w-[340px] lg:border-r xl:w-[380px]`}
      >
        <PeopleListPane />
      </div>
      <div
        className={`${hasSelection ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}
      >
        {children}
      </div>
    </div>
  );
}
