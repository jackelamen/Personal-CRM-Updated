# Rolodex

A personal CRM for the people you actually know: notes, labels, and follow-ups
that do not quietly slip.

## Run it

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

There is nothing else to configure. No database, no API keys, no environment
variables.

## Deploy it

Push to a Git repository and import it on Vercel. It is a stock Next.js app at
the repository root, so the defaults are correct and there is nothing to set up.

```bash
pnpm build   # production build
pnpm start   # serve the build locally
```

## How it works

Contacts are stored in the browser's `localStorage`, which is what makes the app
deployable anywhere with zero configuration and keeps your address book off
anyone else's server.

The trade-off is that data lives in one browser on one device. **Import & data**
has a *Download backup* button that writes a JSON file, and *Restore from
backup* reads it back, which is how you move your list to another machine or
keep a copy. If you later want contacts synced across devices, the whole storage
surface is behind `useStore()` in `lib/store.tsx`, so swapping `localStorage` for
a database means rewriting one file.

## Features

- **Today** — who is due or overdue for a follow-up, with a one-click "Mark
  contacted", plus what is coming later.
- **People** — search across every field, filter by label, sort by name, recency
  or follow-up date.
- **Contact pages** — details, freeform notes, favourites, follow-up scheduling.
- **Import** — Google Contacts CSV or vCard (`.vcf`), by file or pasted text.
  Anyone whose email or phone already exists is skipped, so importing the same
  export twice does not create duplicates.
- **Backup** — export and restore the whole list as JSON.

## Layout

```
app/
  layout.tsx           Shell, fonts, store provider
  page.tsx             Today dashboard
  people/              Index, detail, new, edit
  import/              Import, backup, danger zone
  globals.css          Design tokens and component classes
components/            Nav, contact list and row, monogram, form, empty state
lib/
  store.tsx            All reads and writes; localStorage persistence
  parse.ts             Google Contacts CSV and vCard parsing
  format.ts            Date maths and display helpers
  seed.ts              Sample contacts shown on a first visit
  types.ts             Contact shape
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4. Type set in
IBM Plex Sans and IBM Plex Mono, self-hosted via `next/font`.

## Interface

It is built as an app shell, not a set of pages.

- **Desktop** — a fixed left rail (Today / People / Data, with an overdue
  badge) beside a master-detail split: the people list and the selected
  person's details are on screen together, and each pane scrolls on its own.
- **Mobile** — a bottom tab bar. The list fills the screen; picking someone
  swaps to their details with a back control, rather than pushing a new page.
- **Keyboard** — `/` focuses search from anywhere, `Esc` clears it.
- **Quick actions** — mark contacted, push a follow-up out by a week or a
  month, and edit notes in place (saved on blur). The common moves never
  require opening a form.

## Design rules

Built to the app-like-UI guidance in the `pwadesign` skill, in its order:
shell → one design language → details → glass.

1. **App shell, not document flow.** The frame is `h-dvh` and never scrolls.
   Persistent chrome (side rail on desktop, bottom tab bar on mobile) stays put
   while bounded `.pane` regions scroll inside it. Safe-area insets are honoured
   top and bottom.
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
   pick up the aurora beneath them; a solid background is declared first as the
   fallback for browsers without `backdrop-filter`. Text on a card measures
   6.9:1, well clear of the legibility limit the guidance warns about.

   The floating nav is deliberately **not** glass. Behind it the ground is
   uniformly dark, so a blur revealed nothing and only cost GPU — it is a solid
   light pill, as in the reference. Translucency needs variation behind it to
   mean anything; verify with an opaque control before adding it anywhere.

Colour rules that sit on top of that:

- **One accent, one alarm.** Teal (`--color-accent`) carries positive action.
  Red (`--color-danger`) means one thing: a follow-up you are overdue on.
  Overdue is always spelled out in text and marked with a ring as well, so it
  never rests on colour alone.
- **Avatar tints are a validated set, reserved for people.** Nothing else may
  borrow `--color-c1..c4` — a navigation tile wearing an identity colour is a
  category error. The four hues were re-checked against the current surface for lightness band, chroma, colour-vision
  separation and contrast. Initials sit on top of every avatar, which is the
  secondary encoding that makes the set legal. Do not add a fifth without
  re-running that check.
- **Charts show real events.** The activity chart reads `contact.history`,
  appended each time you mark someone contacted. One series, one hue.

## Installing it

It is a real PWA: web manifest, maskable icons, `display: standalone`, and a
service worker that caches the shell so it opens offline. On Android the
browser offers an install prompt; on iOS use Share → Add to Home Screen. Your
contacts already live on the device, so an installed copy works with no network
at all.

## Layout

```
app/
  layout.tsx           Shell, fonts, store provider
  page.tsx             Today dashboard
  people/              Index, detail, new, edit
  import/              Import, backup, danger zone
  globals.css          Design tokens and component classes
components/            Nav, contact list and row, monogram, form, empty state
lib/
  store.tsx            All reads and writes; localStorage persistence
  parse.ts             Google Contacts CSV and vCard parsing
  format.ts            Date maths and display helpers
  seed.ts              Sample contacts shown on a first visit
  types.ts             Contact shape
```

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4. Type set in
IBM Plex Sans and IBM Plex Mono, self-hosted via `next/font`.

## Interface

It is built as an app shell, not a set of pages.

- **Desktop** — a fixed left rail (Today / People / Data, with an overdue
  badge) beside a master-detail split: the people list and the selected
  person's details are on screen together, and each pane scrolls on its own.
- **Mobile** — a bottom tab bar. The list fills the screen; picking someone
  swaps to their details with a back control, rather than pushing a new page.
- **Keyboard** — `/` focuses search from anywhere, `Esc` clears it.
- **Quick actions** — mark contacted, push a follow-up out by a week or a
  month, and edit notes in place (saved on blur). The common moves never
  require opening a form.

## Design rules

Two conventions worth keeping if you edit the UI:

- **One accent, one alarm.** Lime (`--color-accent`) carries positive action —
  primary buttons, the selected tab, the chart series. Red (`--color-danger`)
  means one thing: a follow-up you are overdue on. Overdue is always spelled
  out in text and marked with a ring as well, so it never rests on colour alone.
- **Avatar tints are a validated set, reserved for people.** Nothing else may
  borrow `--color-c1..c4` — a navigation tile wearing an identity colour is a
  category error. The four hues were re-checked against the current surface for lightness band, chroma, colour-vision
  separation and contrast. Initials sit on top of every avatar, which is the
  secondary encoding that makes the set legal. Do not add a fifth hue without
  re-running that check.
- **Charts show real events.** The activity chart reads `contact.history`,
  appended each time you mark someone contacted. It is one series of one hue,
  because height carries the value and colour carries nothing.
- **Dark, and only dark.** The palette is built and validated against the dark
  surface. A light mode would need its own steps and its own validation pass,
  not an inverted flip.
