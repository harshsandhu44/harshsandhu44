# harshsandhu44

pnpm workspace monorepo.

```sh
pnpm install
pnpm dev:personal
```

## Layout

- `apps/*` — deployable applications
- `packages/*` — shared internal packages (`@harshsandhu44/*`)
- `templates/next-app` — skeleton to copy when adding an app (deliberately outside
  the workspace globs so pnpm never installs or builds it)

## Scripts

| Script              | Does                           |
| ------------------- | ------------------------------ |
| `pnpm dev:personal` | dev server for `apps/personal` |
| `pnpm build`        | `pnpm -r build`                |
| `pnpm lint`         | `pnpm -r lint`                 |
| `pnpm typecheck`    | `pnpm -r typecheck`            |
| `pnpm format`       | Prettier over the repo         |

Each app gets its own `dev:<name>` alias — dev servers all want port 3000, so
there is no repo-wide `dev`.

## Adding an app

```sh
cp -r templates/next-app apps/<name>
grep -rl APP_NAME apps/<name> | xargs sed -i '' "s/APP_NAME/<name>/g"
pnpm install
```

Then add `"dev:<name>": "pnpm --filter <name> dev"` to the root `package.json`,
and create a Vercel project with Root Directory `apps/<name>`.

The template freezes whatever Next/React versions it was copied at. When you
upgrade an app, re-copy its configs into the template.

## Deploys

One Vercel project per app, Root Directory `apps/<name>`. Each app's
`vercel.json` skips the build when neither the app nor `packages/` changed.
