# Rolodex

A personal CRM for the people you actually know: notes, labels, and follow-ups
that do not quietly slip.

## Run it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000. You'll be asked to sign in with an email
one-time code — there's nothing to configure locally; it talks to the same
Supabase project the deployed app uses (see **Backend**).

## Deploy it

Push to a Git repository and import it on Vercel. It is a stock Next.js app at
the repository root, so the defaults are correct and there is nothing to set
up — no environment variables required (see **Backend** for why).

```bash
pnpm build   # production build
pnpm start   # serve the build locally
```

## Backend

Contacts are stored in Supabase (Postgres), in a `rolodex_contacts` table
locked down with row-level security scoped to `auth.uid()` — a user can only
ever read or write their own rows, enforced by the database itself. This is
what makes contacts follow you across every device you sign into, and it
syncs live: a change made on one device appears on another without a manual
refresh, via a Postgres realtime subscription.

The project URL and its publishable key live as fallback constants in
`lib/supabase/client.ts`. That key is designed to be public — Supabase
publishable/anon keys grant no access on their own, RLS does all the work —
so the deployed app needs zero environment variables. Set
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` only if you want
to point a build at a different Supabase project (e.g. your own, for local
development against a clean database).

This Supabase project ("The EDGEx OS") is shared with several other apps, so
`rolodex_contacts` is deliberately namespaced — it cannot collide with that
project's own unrelated `contacts`/`companies` tables. Auth is independent
too: sign-in creates a normal `auth.users` row (shared with those other
apps' sign-in, since it's the same project), but this app never touches their
`profiles`/`workspaces` tables — it only ever reads and writes its own table.

**Auth** is email one-time-code, not magic-link: tapping a link in Mail opens
the system browser rather than the installed PWA, which breaks the
full-screen experience. A 6-digit code typed back into the app has no such
problem.

**Offline**: you can still browse whatever was last loaded — the PWA and its
service worker still work as before — but a write made while offline fails
and rolls back locally rather than silently succeeding; a banner says so.
There is no offline write queue.

**First sign-in**: a brand new account is seeded with the sample contacts
(so the app isn't an empty shell) unless real contacts already exist in this
browser's `localStorage` from before accounts existed, in which case those are
imported into the account instead and the local copy is cleared.

## Features

- **Today** — who is due or overdue for a follow-up, with a one-click "Mark
  contacted", plus what is coming later.
- **People** — search across every field, filter by label, sort by name, recency
  or follow-up date.
- **Contact pages** — details, freeform notes, favourites, follow-up scheduling.
- **Import** — Google Contacts CSV or vCard (`.vcf`), by file or pasted text.
  Anyone whose email or phone already exists is skipped, so importing the same
  export twice does not create duplicates.
- **Backup** — export and restore the whole list as JSON, independent of the
  account sync above.

## Interface

It is built as an app shell, not a set of pages.

- **Desktop** — a fixed left rail (Today / People / Data, with an overdue
  badge) beside a master-detail split: the people list and the selected
  person's details are on screen together, and each pane scrolls on its own.
- **Mobile** — a floating pill nav with a separate circular action. The list
  fills the screen; picking someone swaps to their details with a back
  control, rather than pushing a new page.
- **Keyboard** — `/` focuses search from anywhere, `Esc` clears it.
- **Quick actions** — mark contacted, push a follow-up out by a week or a
  month, and edit notes in place (saved on blur). The common moves never
  require opening a form.

## Installing it

It is a real PWA: web manifest, maskable icons, `display: standalone`, and a
service worker that caches the shell so it opens offline. On Android the
browser offers an install prompt; on iOS use Share → Add to Home Screen.

## Layout

```
app/
  layout.tsx           Auth provider + gate, fonts
  page.tsx             Today dashboard (hero, stats, follow-up queue)
  people/              Master-detail list, contact detail, new, edit
  import/              Import, backup, account (sign out), danger zone
  globals.css          Design tokens and component classes
components/
  AuthGate.tsx          Session check → SignIn or the app
  SignIn.tsx            Email one-time-code sign-in
  AppShell.tsx           Rail / floating nav / PWA install prompt
  Avatar.tsx, Hero.tsx, ActivityChart.tsx, StatusRing.tsx, ContactForm.tsx
lib/
  auth.tsx              Supabase session context
  store.tsx              All reads/writes; Supabase-backed, optimistic + realtime
  supabase/client.ts      Supabase client (URL + publishable key)
  supabase/rows.ts        DB row ⇄ Contact mapping
  parse.ts               Google Contacts CSV and vCard parsing
  format.ts               Date maths, avatar tints, activity buckets
  seed.ts                 Sample contacts for a first-run account
  types.ts                 Contact shape
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase
(Postgres + Auth + Realtime). Type set in Plus Jakarta Sans and IBM Plex Mono,
self-hosted via `next/font`. Icons from Lucide.

## Design rules

Built to the app-like-UI guidance in the `pwadesign` skill, in its order:
shell → one design language → details → glass.

1. **App shell, not document flow.** The frame is `h-dvh` and never scrolls.
   Persistent chrome (side rail on desktop, floating pill nav on mobile) stays
   put while bounded `.pane` regions scroll inside it. Safe-area insets are
   honoured top and bottom.
2. **One design language: midnight/teal, dark.** A neutral-flat system in the
   skill's terms, with its own palette: a deep navy ground under a faint
   starfield, teal as the single accent, and generous rounding. Exactly one
   gradient surface per screen — the hero — and never on a card full of copy.
   The rule is to pick one language and enforce it, so do not introduce
   Material or iOS components alongside these.
3. **Bounded surfaces and one scale.** Content lives in `.card` and `.row`,
   never free-flowing prose. Every tap target clears 44px — where a control
   should stay visually small (chips, segments), the hit area is expanded with
   an `::after` overlay rather than by inflating the pill. One icon set
   (Lucide, 1.75 weight) and one type scale (`--text-display` … `--text-micro`);
   no component sets an ad-hoc font size.
4. **Glass where there is something to see through.** `.card` is translucent
   with `blur(16px) saturate(140%)` over the patterned `.ground`, so surfaces
   pick up the aurora beneath them; a solid background is declared first as
   the fallback for browsers without `backdrop-filter`. Text on a card
   measures 6.9:1, well clear of the legibility limit the guidance warns
   about.

   The floating nav is deliberately **not** glass. Behind it the ground is
   uniformly dark, so a blur revealed nothing and only cost GPU — it is a
   solid light pill, as in the reference. Translucency needs variation behind
   it to mean anything; verify with an opaque control before adding it
   anywhere.

Colour rules that sit on top of that:

- **One accent, one alarm.** Teal (`--color-accent`) carries positive action.
  Red (`--color-danger`) means one thing: a follow-up you are overdue on.
  Overdue is always spelled out in text and marked with a ring as well, so it
  never rests on colour alone.
- **Avatar tints are a validated set, reserved for people.** Nothing else may
  borrow `--color-c1..c4` — a navigation tile wearing an identity colour is a
  category error. The four hues were checked against the dark surface for
  lightness band, chroma, colour-vision separation and contrast. Initials sit
  on top of every avatar, which is the secondary encoding that makes the set
  legal. Do not add a fifth without re-running that check.
- **Charts show real events.** The activity chart reads `contact.history`,
  appended each time you mark someone contacted. One series, one hue.
- **Dark, and only dark.** The palette is built and validated against the dark
  surface. A light mode would need its own steps and its own validation pass,
  not an inverted flip.
