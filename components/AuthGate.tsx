"use client";

import { useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import AppShell from "./AppShell";
import SignIn from "./SignIn";

/**
 * Gates the whole app on an authenticated session. StoreProvider only ever
 * mounts once a session exists, so it can assume a user id is present and
 * never has to juggle a signed-out state itself.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();

  // Avoid a flash of the sign-in screen while the session check is in
  // flight; a blank ground for a beat reads as loading, not broken.
  if (!ready) return <div className="ground h-dvh" />;

  if (!session) return <SignIn />;

  return (
    <StoreProvider>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
