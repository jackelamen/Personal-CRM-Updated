import { createClient } from "@supabase/supabase-js";

/**
 * Connection for the shared "EDGEx OS" Supabase project. The URL and
 * publishable key below are safe to ship in client code — Supabase
 * publishable/anon keys are designed to be public; every table this app
 * touches (rolodex_contacts) is locked down with row-level security scoped
 * to auth.uid(), so a key alone grants no access to anyone else's data.
 *
 * Env vars override these when set (e.g. to point a local dev build at a
 * different project), but nothing needs to be configured for the deployed
 * app to work.
 */
const FALLBACK_URL = "https://mdkyijbgvxedelcqcouu.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_K48G2cqwoLi46Y51TJHj-Q_00KgxXsC";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
