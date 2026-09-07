"use client";

import { usePathname } from "next/navigation";
import PeopleListPane from "@/components/PeopleListPane";

/**
 * Master-detail. On desktop both panes are visible at once. On mobile only
 * one is: the list until you pick someone, then the detail, which is what a
 * native app does rather than pushing a whole new page.
 *
 * "Detail" means any route under /people other than the index itself —
 * /people/[id], /people/[id]/edit, and /people/new. Using useParams().id to
 * decide this was a bug: /people/new is a static sibling route, not
 * /people/[id], so it never carries an id param and the mobile pane stayed
 * hidden — every "Add contact" entry point silently did nothing on mobile.
 */
export default function PeopleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasSelection = pathname !== "/people";

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
