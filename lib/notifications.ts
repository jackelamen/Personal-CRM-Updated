"use client";

import { daysUntil, isOverdue } from "./format";
import type { Contact } from "./types";

/**
 * Local (client-side) follow-up reminders via the Notifications API. There is
 * no push server behind this: a notification only fires while the app has
 * been opened (foreground or a background tab/installed PWA), because that
 * is what runs the check below. It is not a background push that reaches you
 * while Rolodex is fully closed.
 */

const NOTIFIED_KEY = "rolodex/notified-followups";
export const FOLLOW_UP_NOTIFICATION_TAG = "rolodex-followups";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  return isNotificationSupported() ? Notification.permission : "denied";
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  return Notification.requestPermission();
}

function readNotifiedKeys(): Set<string> {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeNotifiedKeys(keys: Set<string>): void {
  try {
    window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...keys]));
  } catch {
    // Not worth failing over; worst case is a repeated notification later.
  }
}

/** True once a contact's next follow-up has arrived (today or overdue). */
function isDueForNotification(contact: Contact): boolean {
  if (!contact.nextFollowUp) return false;
  return isOverdue(contact.nextFollowUp) || daysUntil(contact.nextFollowUp) === 0;
}

/** Keyed by follow-up date, not just contact id, so a resolved and later
 *  re-scheduled follow-up is treated as new and can notify again. */
function notificationKey(contact: Contact): string {
  return `${contact.id}:${contact.nextFollowUp}`;
}

async function showFollowUpNotification(due: Contact[]): Promise<void> {
  const title = due.length === 1 ? `Follow up with ${due[0].name}` : `${due.length} follow-ups due`;
  const body =
    due.length === 1
      ? due[0].notes || "It's time to reach out."
      : due
          .slice(0, 4)
          .map((contact) => contact.name)
          .join(", ") + (due.length > 4 ? `, and ${due.length - 4} more` : "");

  // `renotify` is part of the Notifications spec (it makes replacing an
  // existing tagged notification alert again instead of updating silently),
  // but TypeScript's bundled DOM types don't declare it yet.
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    tag: FOLLOW_UP_NOTIFICATION_TAG,
    renotify: true,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/" },
  };

  // Route through the service worker when one is registered, so the
  // notification (and its click handler) works even for a backgrounded tab.
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    } catch {
      // Fall through to a plain Notification below.
    }
  }
  if (isNotificationSupported()) new Notification(title, options);
}

/**
 * Notify about contacts newly due or overdue for a follow-up. Safe to call
 * on every contacts change: it dedupes by (contact, follow-up date) so the
 * same pending follow-up only notifies once.
 */
export async function notifyDueFollowUps(contacts: Contact[]): Promise<void> {
  if (getNotificationPermission() !== "granted") return;

  const due = contacts.filter(isDueForNotification);
  const notified = readNotifiedKeys();
  const fresh = due.filter((contact) => !notified.has(notificationKey(contact)));

  // Keep only currently-due keys, so a follow-up that gets resolved and
  // later comes due again is treated as new rather than staying suppressed.
  writeNotifiedKeys(new Set(due.map(notificationKey)));

  if (fresh.length > 0) await showFollowUpNotification(fresh);
}
