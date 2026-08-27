# harshsandhu44

pnpm workspace monorepo.

```sh
pnpm install
pnpm dev
```

## Layout

- `apps/*` — deployable applications
- `packages/*` — shared internal packages (`@harshsandhu44/*`)
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
