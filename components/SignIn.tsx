"use client";

import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Method = "code" | "password";
type Stage = "email" | "code";

/**
 * Two ways in, same account either way — this project's auth.users table is
 * shared with Pulse/xPM/EDGEx OS, so whichever method you use, signing in
 * with the same email lands on the identity you already have there. Your
 * contacts stay private to that account regardless: every table this app
 * touches is scoped to auth.uid(), so nothing here can see Pulse/xPM data or
 * vice versa.
 *
 * Code is the default because it works for anyone, with nothing to
 * remember. It's also deliberately not magic-link: tapping a link in Mail
 * opens the system browser, not this installed PWA, which breaks the
 * standalone experience. Password is offered as a shortcut for an account
 * that already has one (from signing in elsewhere in this EDGEx OS project).
 */
export default function SignIn() {
  const [method, setMethod] = useState<Method>("code");
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMethod = (next: Method) => {
    setMethod(next);
    setStage("email");
    setError(null);
  };

  const signInWithPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    setBusy(false);
    if (signInError) setError(signInError.message);
    // On success the auth listener in AuthProvider swaps this screen out.
  };

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setStage("code");
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    // On success, the auth listener in AuthProvider picks up the new
    // session and swaps this screen out — nothing else to do here.
  };

  return (
    <div className="ground flex h-dvh items-center justify-center p-5">
      <div className="card w-full max-w-sm p-6">
        <span className="icon-chip bg-card-2 text-accent">
          {method === "password" ? (
            <KeyRound size={18} strokeWidth={1.9} />
          ) : (
            <Mail size={18} strokeWidth={1.9} />
          )}
        </span>
        <h1 className="mt-3 text-title font-bold">Sign in to Rolodex</h1>
        <p className="mt-1 text-callout text-fg-muted">
          {method === "password"
            ? "Use the same email and password you sign into Pulse or xPM with."
            : "Your contacts sync to your account, so they follow you to any device."}
        </p>

        {method === "password" ? (
          <form onSubmit={signInWithPassword} className="mt-5 space-y-3">
            <label className="block">
              <span className="label">Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="field mt-1"
              />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="field mt-1"
              />
            </label>
            {error ? <p className="text-caption text-danger">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => switchMethod("code")}
              className="btn btn-ghost w-full"
            >
              Email me a code instead
            </button>
          </form>
        ) : stage === "email" ? (
          <form onSubmit={sendCode} className="mt-5 space-y-3">
            <label className="block">
              <span className="label">Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="field mt-1"
              />
            </label>
            {error ? <p className="text-caption text-danger">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Sending…" : "Send code"}
            </button>
            <button
              type="button"
              onClick={() => switchMethod("password")}
              className="btn btn-ghost w-full"
            >
              Have a password already? Use it instead
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="mt-5 space-y-3">
            <p className="text-callout text-fg-muted">
              We sent a 6-digit code to <span className="text-fg">{email}</span>.
            </p>
            <label className="block">
              <span className="label">Code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className="field mt-1 tabular tracking-[0.3em]"
              />
            </label>
            {error ? <p className="text-caption text-danger">{error}</p> : null}
            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setCode("");
                setError(null);
              }}
              className="btn btn-ghost w-full"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
