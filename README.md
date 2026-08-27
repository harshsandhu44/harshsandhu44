# harshsandhu44

pnpm workspace monorepo.

```sh
pnpm install
pnpm dev
```

## Layout

- `apps/*` — deployable applications
- `packages/*` — shared internal packages (`@harshsandhu44/*`)
- `packages/ui` — the shadcn component library every app imports
- `templates/next-app` — skeleton to copy when adding an app (deliberately outside
  the workspace globs so pnpm never installs or builds it)

## Scripts

| Script           | Does                                 |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | `pnpm -r --parallel dev` — every app |
| `pnpm build`     | `pnpm -r build`                      |
| `pnpm lint`      | `pnpm -r lint`                       |
| `pnpm typecheck` | `pnpm -r typecheck`                  |
| `pnpm format`    | Prettier over the repo               |

`pnpm dev` runs every app at once with their logs interleaved, so each app pins
its own port in its `dev` script. `apps/personal` owns 3000. To work on one app
alone, use `pnpm --filter <name> dev`.

| App        | Port |
| ---------- | ---- |
| `personal` | 3000 |

## UI components

`packages/ui` (`@harshsandhu44/ui`) owns every shadcn component, the `cn` helper
and the theme plumbing. It ships raw `.tsx` through its `exports` map with no
build step — Turbopack transpiles workspace packages automatically.

```sh
pnpm --filter @harshsandhu44/ui exec shadcn add <name>
```

Run it from the package, never from an app: the `shadcn` dependency and
`components.json` live there. Inside the package, files import each other with
`#...` package imports; apps import them by path:

```ts
import { Button } from "@harshsandhu44/ui/components/button";
import { cn } from "@harshsandhu44/ui/lib/utils";
```

Apps use `#components/*`, `#lib/*` and `#hooks/*` for their own local files.
There is no `@/*` alias.

Styling splits in two. The package's `base.css` carries the Tailwind theme
mappings, shadcn's variants and the base layer; `tokens.css` carries the default
olive `base-lyra` palette. An app imports both, then overrides any token in its
own `:root`. Fonts stay app-side — the package applies `font-sans`, the app
decides what it means.

Two things an app's `globals.css` must keep: `@import "tailwindcss"` (Tailwind's
source detection roots at whichever app owns that import) and the `@source` line
pointing at `packages/ui/src`, without which classes used only inside the
package generate no CSS.

## Adding an app

```sh
cp -r templates/next-app apps/<name>
grep -rl APP_NAME apps/<name> | xargs sed -i '' "s/APP_NAME/<name>/g"
sed -i '' "s/APP_PORT/<port>/" apps/<name>/package.json
pnpm install
```

Pick a port no other app uses and add the app to the port table above. Then
create a Vercel project with Root Directory `apps/<name>`.

The template freezes whatever Next/React versions it was copied at. When you
upgrade an app, re-copy its configs into the template.

## Deploys

One Vercel project per app, Root Directory `apps/<name>`. Each app's
`vercel.json` skips the build when neither the app nor `packages/` changed.

`apps/personal` additionally wants `KEYSTATIC_GITHUB_CLIENT_ID`,
`KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET` for CMS editing in
production. Without them the build still succeeds and the site still reads its
content — only `/keystatic` falls back to local mode. See `apps/personal/README.md`.
