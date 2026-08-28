# personal

`harshsandhu.com` — a tiling window manager that happens to be a portfolio.

```sh
pnpm --filter personal dev     # :3000
pnpm --filter personal test    # the tree's unit tests
```

## The idea

The site is a desktop: a numbered section bar, panes tiled by a real BSP tree,
and a shell that drives both. Keyboard is the point, but never the only way in —
every binding has a click target, and every pane scrolls and links normally.

Palette is **solder mask & copper**, taken from TinkerSim's own world rather than
a theme repo. Copper means _position_ (focused pane, focus ring, prompt); gold
means _current_ (links, active section, live status). Nothing else gets an
accent. Type is Geist Mono for chrome and data, Geist Sans for prose.

## Layout lives in the URL

The tree is not client state. The server parses `?l=`, renders the panes it
names, and hands the tree down as a prop; every action is a `router.push`.

```
/resume                              one pane
/resume?l=h(resume,about)            side by side
/about?l=v(about,h(resume,contact))  nested
```

That is why back/forward step through arrangements, why a link restores one
exactly, and why crawlers get every open pane as real HTML. A malformed or
unrecognised `?l=` falls back to a single pane rather than erroring — it is user
input.

A view appears at most once in a tree, so a leaf's id is just its view name.
Opening a section that is already open focuses it.

`src/components/wm/tree.ts` is pure and has no React in it. It is the only real
logic here, so it is the only thing with tests — `pnpm test` covers splitting,
closing, serialising, tiling and directional focus.

## Keys

|                          |                                             |
| ------------------------ | ------------------------------------------- |
| `1`–`4`                  | open or focus a section                     |
| `h` `j` `k` `l` / arrows | move focus                                  |
| `⇧` + `h j k l`          | take the focused pane with you              |
| `⌥` + `h j k l`          | resize the focused pane                     |
| `⌘\` / `⌘-`              | lay the focused group out in columns / rows |
| `⌘W`                     | close the focused pane                      |
| `` ` ``                  | toggle the terminal, `esc` to close         |

Alt bindings match on `event.code`: on macOS `⌥h` produces `˙`, so `event.key`
is useless for them.

## Resizing and moving

Drag a seam to resize, or a pane's title bar to move it. The drop preview shows
where it lands — the middle of a pane swaps the two, an edge pulls the pane out
and re-splits there.

Both are the existing `close`/`split` pair underneath, so a drag can only ever
produce a tree the URL could already describe. Resizes `replace` rather than
`push`: a resize is a tweak to the current arrangement, not a new one, and fifty
history entries per drag would make the back button useless.

Shares are clamped at `MIN_SHARE`, so dragging cannot collapse a pane out of
existence — closing stays a deliberate act. A container nobody has dragged has
no `sizes` at all and stays even when a pane joins it, which is why an untouched
layout serialises with no numbers in it:

```
/about?l=h(about,resume)             even
/about?l=h(about:70,resume:30)       dragged
```

Neither applies below 768px — both need two panes on screen.

## The shell

`src/lib/vfs.ts` builds a virtual filesystem on the server from the same
Keystatic reads the panes use, so `ls` cannot list a file the panes do not
render. Commands live in `src/components/shell/commands.ts`; each one owns its
usage string, its output and its error message.

`ls` `cd` `pwd` `cat` `open` `grep` · `close` `focus` `move` `resize`
`rotate` `clear` ·
`whoami` `uptime` `neofetch` `sudo` `crt` `echo` `help`

Tab completion, arrow-key history, `Ctrl+C`, `Ctrl+L`.

## Content

Keystatic, git-backed — the CMS UI writes files into `content/`, which is why the
vfs can read them synchronously at build time with no runtime fetch.

```
content/profile.json  skills.json  experience/*.json  education/*.json  projects/*.mdx
```

Edit at `/keystatic`. In development that writes straight to disk. In production
it opens commits, which needs a GitHub App and four env vars:

```
KEYSTATIC_GITHUB_CLIENT_ID
KEYSTATIC_GITHUB_CLIENT_SECRET
KEYSTATIC_SECRET
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
```

Storage mode is gated on the first three being present rather than on
`NODE_ENV`, so the build stays green before the App exists — Keystatic throws at
build time in production when they are missing, and a missing CMS login should
not be able to stop a deploy. Reading content never goes through storage mode.

### Creating the App

Chicken-and-egg: the wizard that creates the App only runs in GitHub mode, and
GitHub mode only switches on once the App exists. `KEYSTATIC_STORAGE=github`
breaks the loop, and is honoured in development only so it can never
reintroduce the build-time throw.

```sh
echo "KEYSTATIC_STORAGE=github" > apps/personal/.env.local
pnpm --filter personal dev
```

Then open `/keystatic`. It redirects to `/keystatic/setup`:

1. Put the production origin (`https://harshsandhu.com`) in the deployed-URL
   field. The App is created with callbacks for localhost **and** that origin,
   so one App covers both. Skip it and production needs its own App.
2. Create the App. GitHub takes over, then hands back to
   `/api/keystatic/github/created-app`, which writes all four values into
   `apps/personal/.env`.
3. Delete `.env.local` and restart. The real env vars now select GitHub mode on
   their own.
4. Copy the four values into Vercel, Production and Preview.

`.env` and `.env.local` are gitignored; `.env.example` documents the shape.

Note the slug fields: `experience.company`, `education.institution` and
`projects.name` each store a display name in the file _and_ derive the slug from
the filename. Omit the display half and the entry reads back as `""`.

## Motion and the CRT

One boot sequence, about a second, skipped on return visits (`sessionStorage`),
under `prefers-reduced-motion`, and by any key or click.

The ambient CRT layer is one fixed compositor layer, dropped below 768px, and
toggled by `crt on|off` (persisted). Its numbers are load-bearing: **every text
colour clears WCAG AA measured through the overlay at the darkest corner of the
vignette** — verified worst case 4.5:1. That is why `--copper` and `--silk-dim`
are lighter than a real board, and why the vignette stops at `0.14`. Darkening
either, or strengthening the vignette, breaks the floor.

## Mobile

Below 768px the tree draws only its focused leaf, full bleed, and horizontal
swipe moves between sections. Same components, same URLs, no second design.

## Not built yet

- `/work/[slug]` case studies. Projects list and `cat /work/<slug>` works; `open`
  refuses honestly until the pane exists.
- Light theme. A light board is a different palette, not an inversion.
