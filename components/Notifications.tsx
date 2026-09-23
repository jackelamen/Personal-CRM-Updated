"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getNotificationPermission, notifyDueFollowUps } from "@/lib/notifications";

/**
 * Mounted once, app-wide (see AppShell). Checks for newly due follow-ups
 * every time the contact list changes and, if notifications are already
 * granted, fires a reminder. The permission prompt itself lives on the
 * Import & data page, where a click can trigger it.
 */
export default function Notifications() {
  const { contacts, ready } = useStore();

  useEffect(() => {
    if (!ready) return;
    if (getNotificationPermission() !== "granted") return;
    void notifyDueFollowUps(contacts);
  }, [ready, contacts]);

  return null;
}
