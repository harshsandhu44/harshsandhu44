# apps/web

Next.js app — the pixel-farm portfolio at [harshsandhu.com](https://harshsandhu.com).

## Layout

| Path                       | What                                              |
| -------------------------- | ------------------------------------------------- |
| `apps/web`                 | Next.js app                                       |
| `packages/tsconfig`        | `@hs95/tsconfig` — shared `tsconfig` bases        |
| `packages/eslint-config`   | `@hs95/eslint-config` — shared ESLint flat config |
| `packages/prettier-config` | `@hs95/prettier-config` — shared Prettier config  |

## Commands

```bash
pnpm install
pnpm dev           # turbo run dev
pnpm build         # turbo run build
pnpm lint          # turbo run lint
pnpm check-types   # turbo run check-types
pnpm format        # prettier --write
```

## Adding a Next.js app

```bash
pnpm create next-app apps/<name>
```

Then in the app:

- `tsconfig.json` → `"extends": "@hs95/tsconfig/nextjs.json"`
- `eslint.config.mjs` → `import { next } from "@hs95/eslint-config/next"; export default next;`
- add `@hs95/tsconfig`, `@hs95/eslint-config` as `workspace:*` devDependencies
- give it `lint`, `check-types`, `build` scripts so Turbo picks them up

### Toolchain pins

- **ESLint 9** — `@hs95/eslint-config` targets the v9 line; `eslint-config-next`'s
  plugin stack doesn't support v10 yet. Keep apps on `eslint@9`.
- **TypeScript 6** — `typescript-eslint` doesn't support the TS 7 API yet, so the
  root pins `typescript@6`. If an app needs `typescript@7`, its lint step will
  break until `typescript-eslint` catches up — pin the app to `6` too for now.
