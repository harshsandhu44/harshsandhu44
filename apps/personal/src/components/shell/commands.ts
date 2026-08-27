import type { Vfs } from "#lib/vfs";
import type { Dir } from "../wm/tree";

export type Line = { text: string; tone?: "dim" | "error" | "accent" };

export type ShellEnv = {
  vfs: Vfs;
  cwd: string;
  setCwd: (path: string) => void;
  open: (view: string) => void;
  closePane: () => void;
  move: (dir: "left" | "right" | "up" | "down") => void;
  rotate: (dir: Dir) => void;
  clear: () => void;
  setCrt: (on: boolean) => void;
  crt: boolean;
};

export type Command = {
  name: string;
  usage: string;
  blurb: string;
  run: (args: string[], env: ShellEnv) => Line[];
};

const dim = (text: string): Line => ({ text, tone: "dim" });
const err = (text: string): Line => ({ text, tone: "error" });
const plain = (text: string): Line => ({ text });

/** Resolves `arg` against `cwd`, the way a shell does. */
export function resolvePath(cwd: string, arg: string | undefined): string {
  if (!arg || arg === ".") return cwd;
  if (arg === "~" || arg === "/") return "/";
  const base = arg.startsWith("/") ? [] : cwd.split("/").filter(Boolean);
  for (const part of arg.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return `/${base.join("/")}`;
}

const childrenOf = (vfs: Vfs, path: string) => {
  const prefix = path === "/" ? "/" : `${path}/`;
  const names = new Set<string>();
  for (const file of vfs.files) {
    if (!file.path.startsWith(prefix) || file.path === path) continue;
    const rest = file.path.slice(prefix.length);
    if (!rest) continue;
    names.add(rest.split("/")[0]!);
  }
  return [...names].sort();
};

const isDir = (vfs: Vfs, path: string) =>
  path === "/" || childrenOf(vfs, path).length > 0;

const findFile = (vfs: Vfs, path: string) =>
  vfs.files.find((f) => f.path === path);

const DIRECTIONS: Record<string, "left" | "right" | "up" | "down"> = {
  h: "left",
  j: "down",
  k: "up",
  l: "right",
  left: "left",
  down: "down",
  up: "up",
  right: "right",
};

export const COMMANDS: Command[] = [
  {
    name: "help",
    usage: "help",
    blurb: "list commands",
    run: () => [
      dim("navigate"),
      ...COMMANDS.filter((c) => GROUP.navigate.includes(c.name)).map(row),
      dim(""),
      dim("windows"),
      ...COMMANDS.filter((c) => GROUP.windows.includes(c.name)).map(row),
      dim(""),
      dim("keys"),
      plain("  ⌘\\ / ⌘-    lay the focused group out in columns / rows"),
      plain("  ⌘W          close the focused pane"),
      plain("  h j k l     move focus  ·  1-4 open a section"),
      plain("  `           toggle this terminal  ·  esc to close"),
    ],
  },
  {
    name: "ls",
    usage: "ls [path]",
    blurb: "list a directory",
    run: (args, env) => {
      const path = resolvePath(env.cwd, args[0]);
      const kids = childrenOf(env.vfs, path);
      if (kids.length === 0) {
        return findFile(env.vfs, path)
          ? [plain(path.split("/").pop()!)]
          : [err(`ls: ${path}: no such file or directory`)];
      }
      return [
        plain(
          kids
            .map((name) =>
              isDir(env.vfs, `${path === "/" ? "" : path}/${name}`)
                ? `${name}/`
                : name,
            )
            .join("   "),
        ),
      ];
    },
  },
  {
    name: "cd",
    usage: "cd <path>",
    blurb: "change directory",
    run: (args, env) => {
      const path = resolvePath(env.cwd, args[0] ?? "/");
      if (!isDir(env.vfs, path)) {
        return findFile(env.vfs, path)
          ? [err(`cd: ${path}: not a directory`)]
          : [err(`cd: ${path}: no such file or directory`)];
      }
      env.setCwd(path);
      return [];
    },
  },
  {
    name: "pwd",
    usage: "pwd",
    blurb: "print working directory",
    run: (_args, env) => [plain(env.cwd)],
  },
  {
    name: "cat",
    usage: "cat <path>",
    blurb: "print a file",
    run: (args, env) => {
      if (!args[0]) return [err("cat: expected a path")];
      const path = resolvePath(env.cwd, args[0]);
      const file = findFile(env.vfs, path);
      if (!file) {
        return isDir(env.vfs, path)
          ? [err(`cat: ${path}: is a directory`)]
          : [err(`cat: ${path}: no such file or directory`)];
      }
      return file.text.split("\n").map(plain);
    },
  },
  {
    name: "open",
    usage: "open <path>",
    blurb: "open a path as a pane",
    run: (args, env) => {
      if (!args[0]) return [err("open: expected a path")];
      const path = resolvePath(env.cwd, args[0]);
      const file = findFile(env.vfs, path);
      if (!file) return [err(`open: ${path}: no such file or directory`)];
      if (!file.openable) {
        return [
          err(`open: ${path}: no pane for this path yet`),
          dim(`  case studies are still being written — try: cat ${path}`),
        ];
      }
      env.open(path.replace(/^\//, ""));
      return [];
    },
  },
  {
    name: "grep",
    usage: "grep <pattern>",
    blurb: "search everything",
    run: (args, env) => {
      const pattern = args.join(" ").trim();
      if (!pattern) return [err("grep: expected a pattern")];
      let re: RegExp;
      try {
        re = new RegExp(pattern, "i");
      } catch {
        return [err(`grep: ${pattern}: invalid pattern`)];
      }
      const hits: Line[] = [];
      for (const file of env.vfs.files) {
        for (const line of file.text.split("\n")) {
          if (re.test(line) && line.trim()) {
            hits.push(plain(`${file.path}: ${line.trim()}`));
          }
        }
      }
      return hits.length ? hits : [dim(`no matches for ${pattern}`)];
    },
  },
  {
    name: "close",
    usage: "close",
    blurb: "close the focused pane",
    run: (_args, env) => {
      env.closePane();
      return [];
    },
  },
  {
    name: "focus",
    usage: "focus <h|j|k|l>",
    blurb: "move focus",
    run: (args, env) => {
      const dir = DIRECTIONS[(args[0] ?? "").toLowerCase()];
      if (!dir) return [err("focus: expected one of h j k l")];
      env.move(dir);
      return [];
    },
  },
  {
    name: "rotate",
    usage: "rotate <h|v>",
    blurb: "lay the focused group out in columns or rows",
    run: (args, env) => {
      const dir = (args[0] ?? "").toLowerCase();
      if (dir !== "h" && dir !== "v") {
        return [err("rotate: expected h (columns) or v (rows)")];
      }
      env.rotate(dir);
      return [];
    },
  },
  {
    name: "clear",
    usage: "clear",
    blurb: "clear the terminal",
    run: (_args, env) => {
      env.clear();
      return [];
    },
  },
  {
    name: "whoami",
    usage: "whoami",
    blurb: "who is this",
    run: (_args, env) => [
      plain(env.vfs.profile.name.toLowerCase().replace(/\s+/g, "")),
      dim(`${env.vfs.profile.role} · ${env.vfs.profile.location}`),
    ],
  },
  {
    name: "uptime",
    usage: "uptime",
    blurb: "time shipping software",
    run: () => {
      const start = new Date("2022-02-01T00:00:00Z");
      const months = Math.floor(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
      );
      return [
        plain(
          `up ${Math.floor(months / 12)} years, ${months % 12} months, 3 employers`,
        ),
        dim(
          "load average: one product, two side projects, one Rust rabbit hole",
        ),
      ];
    },
  },
  {
    name: "neofetch",
    usage: "neofetch",
    blurb: "the obligatory one",
    run: (_args, env) => {
      const facts = [
        `${env.vfs.profile.name.toLowerCase().replace(/\s+/g, "")}@board`,
        "─────────────────────",
        `role     ${env.vfs.profile.role}`,
        `at       ${env.vfs.profile.location}`,
        `now      ${env.vfs.profile.tagline}`,
        `wm       tiling, BSP, home-grown`,
        `theme    solder mask & copper`,
        `stack    ${env.vfs.stack.slice(0, 6).join(", ")}`,
      ];
      return BOARD.map((art, index) =>
        plain(`${art}  ${facts[index] ?? ""}`.trimEnd()),
      );
    },
  },
  {
    name: "sudo",
    usage: "sudo <anything>",
    blurb: "no",
    run: (args) => [
      err(`sudo: ${args[0] ?? "you"}: permission denied`),
      dim("this incident has been soldered to the board."),
    ],
  },
  {
    name: "crt",
    usage: "crt <on|off>",
    blurb: "toggle the screen effect",
    run: (args, env) => {
      const arg = (args[0] ?? "").toLowerCase();
      if (arg !== "on" && arg !== "off") {
        return [
          dim(`crt is ${env.crt ? "on" : "off"} — try: crt on | crt off`),
        ];
      }
      env.setCrt(arg === "on");
      return [dim(`crt ${arg}`)];
    },
  },
  {
    name: "echo",
    usage: "echo <text>",
    blurb: "say it back",
    run: (args) => [plain(args.join(" "))],
  },
];

const GROUP = {
  navigate: ["ls", "cd", "pwd", "cat", "open", "grep"],
  windows: ["close", "focus", "rotate", "clear"],
};

const row = (c: Command): Line => ({
  text: `  ${c.usage.padEnd(18)}${c.blurb}`,
});

const BOARD = [
  "┌───────────────┐",
  "│ ▪▪▪  ┌─────┐  │",
  "│      │ MCU │  │",
  "│ ═════╡     ╞══│",
  "│      └─────┘  │",
  "│  ○   ▪▪▪▪▪▪   │",
  "│ ═══════════   │",
  "└───────────────┘",
];

export const COMMAND_NAMES = COMMANDS.map((c) => c.name);

export function runCommand(input: string, env: ShellEnv): Line[] {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const command = COMMANDS.find((c) => c.name === name);
  if (!command) {
    return [
      err(`${name}: command not found`),
      dim("type `help` for what this shell does understand"),
    ];
  }
  return command.run(args, env);
}

/** Tab completion over command names first, then paths. */
export function complete(input: string, env: ShellEnv): string[] {
  const parts = input.split(/\s+/);
  if (parts.length <= 1) {
    return COMMAND_NAMES.filter((n) => n.startsWith(parts[0] ?? ""));
  }
  const fragment = parts[parts.length - 1] ?? "";
  const slash = fragment.lastIndexOf("/");
  const dirPart = slash === -1 ? "" : fragment.slice(0, slash + 1);
  const namePart = slash === -1 ? fragment : fragment.slice(slash + 1);
  const base = resolvePath(env.cwd, dirPart || ".");
  return childrenOf(env.vfs, base)
    .filter((n) => n.startsWith(namePart))
    .map((n) => dirPart + n);
}
