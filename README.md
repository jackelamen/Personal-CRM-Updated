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

Two conventions worth keeping if you edit the UI:

- **Colour is a signal, not decoration.** Deep navy carries every piece of
  structure. The crimson (`--color-signal`) means one thing: a person you are
  overdue to contact. Spending it anywhere else costs the reader the ability to
  spot an overdue row at a glance. Follow-up state is always carried by text as
  well as colour, so nothing depends on colour alone.
- **Density over decoration.** This is a tool. Type is small and tight, rows
  are compact, chrome is quiet, and the data reads first. Resist adding
  headline-scale typography or page-level whitespace.
