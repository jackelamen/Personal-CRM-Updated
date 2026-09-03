import { todayInputDate } from "./format";
import type { Contact } from "./types";

/** Shift a date by whole days and format it as `YYYY-MM-DD`. */
function offsetDays(days: number): string {
  const date = new Date(`${todayInputDate()}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * A handful of contacts shown on a first visit, so the app is not an empty
 * shell. Dates are relative to today so the follow-up views always demonstrate
 * an overdue item, one due today, and one upcoming.
 */
export function seedContacts(): Contact[] {
  return [
    {
      id: "sample-maya",
      firstName: "Maya",
      lastName: "Chen",
      name: "Maya Chen",
      company: "Northstar Studio",
      role: "Creative Director",
      email: "maya.chen@example.com",
      phone: "+1 415 555 0182",
      notes:
        "Met at the design roundtable. She is exploring a move into independent consulting and asked to be introduced to two people doing the same.",
      labels: ["Design", "Local"],
      lastContacted: offsetDays(-14),
      nextFollowUp: offsetDays(-2),
      source: "sample",
      favorite: true,
    },
    {
      id: "sample-alex",
      firstName: "Alex",
      lastName: "Rivera",
      name: "Alex Rivera",
      company: "Field Notes",
      role: "Founder",
      email: "alex.rivera@example.com",
      notes: "Send the photo from the hiking trip and ask about the fall retreat.",
      labels: ["Friends"],
      lastContacted: offsetDays(-23),
      nextFollowUp: todayInputDate(),
      source: "sample",
    },
    {
      id: "sample-jordan",
      firstName: "Jordan",
      lastName: "Kim",
      name: "Jordan Kim",
      company: "Orbit Health",
      role: "Product Lead",
      email: "jordan.kim@example.com",
      phone: "+1 212 555 0127",
      notes: "Interested in swapping notes on community-led growth.",
      labels: ["Work"],
      lastContacted: offsetDays(-37),
      nextFollowUp: offsetDays(5),
      source: "sample",
    },
    {
      id: "sample-nadia",
      firstName: "Nadia",
      lastName: "Osei",
      name: "Nadia Osei",
      company: "Coldwater Press",
      role: "Editor",
      email: "nadia@example.com",
      notes: "Wants a draft of the essay by the end of the quarter.",
      labels: ["Writing", "Work"],
      lastContacted: offsetDays(-6),
      source: "sample",
      favorite: true,
    },
  ];
}
