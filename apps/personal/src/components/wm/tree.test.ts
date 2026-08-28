/* Run: node --test src/components/wm/tree.test.ts
 * No framework. The tree is the one piece of real logic on this site, so it is
 * the one piece that gets a check. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  leaf,
  views,
  parse,
  serialize,
  split,
  close,
  rects,
  focusDir,
  setDir,
  autoDir,
  swap,
  moveTo,
  dividers,
  resizeAt,
  seamFor,
  shares,
  MIN_SHARE,
} from "./tree.ts";

const FRAME = { x: 0, y: 0, w: 1000, h: 1000 };

test("round-trips every shape it can produce", () => {
  for (const s of [
    "about",
    "h(about,resume)",
    "v(about,resume)",
    "h(about,v(resume,contact))",
    "v(h(a,b),h(c,d))",
    "h(about,resume,contact)",
  ]) {
    assert.equal(serialize(parse(s)!), s);
  }
});

test("rejects malformed layouts rather than throwing", () => {
  for (const s of [
    "",
    "h(",
    "h(about)", // a container needs two children
    "x(about,resume)", // unknown direction
    "h(about,about)", // duplicate view
    "h(about,resume))",
    "about,resume",
  ]) {
    assert.equal(parse(s), null, `expected null for ${JSON.stringify(s)}`);
  }
});

test("split wraps a lone leaf", () => {
  assert.equal(
    serialize(split(leaf("about"), "about", "h", "resume")),
    "h(about,resume)",
  );
  assert.equal(
    serialize(split(leaf("about"), "about", "v", "resume")),
    "v(about,resume)",
  );
});

test("split joins a container of the same direction instead of nesting", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(
    serialize(split(t, "resume", "h", "contact")),
    "h(about,resume,contact)",
  );
});

test("split nests when the direction differs", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(
    serialize(split(t, "resume", "v", "contact")),
    "h(about,v(resume,contact))",
  );
});

test("split inserts after the target, not at the end", () => {
  const t = parse("h(about,resume,contact)")!;
  assert.equal(
    serialize(split(t, "about", "h", "work")),
    "h(about,work,resume,contact)",
  );
});

test("opening a view that is already open changes nothing", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(serialize(split(t, "about", "v", "resume")), "h(about,resume)");
});

test("close collapses single-child containers", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(serialize(close(t, "contact")!), "h(about,resume)");
});

test("close of the last pane returns null", () => {
  assert.equal(close(leaf("about"), "about"), null);
});

test("close of an absent view is a no-op", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(serialize(close(t, "work")!), "h(about,resume)");
});

test("split then close is identity", () => {
  const t = parse("h(about,v(resume,contact))")!;
  const grown = split(t, "resume", "h", "work");
  assert.equal(serialize(close(grown, "work")!), serialize(t));
});

test("rects tile the frame exactly, with no gaps or overlap", () => {
  const t = parse("h(about,v(resume,contact))")!;
  const r = rects(t, FRAME);
  assert.deepEqual(r.get("about"), { x: 0, y: 0, w: 500, h: 1000 });
  assert.deepEqual(r.get("resume"), { x: 500, y: 0, w: 500, h: 500 });
  assert.deepEqual(r.get("contact"), { x: 500, y: 500, w: 500, h: 500 });

  const area = [...r.values()].reduce((sum, x) => sum + x.w * x.h, 0);
  assert.equal(area, FRAME.w * FRAME.h);
});

test("focus moves geometrically, not by tree order", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(focusDir(t, "about", "right", FRAME), "resume");
  assert.equal(focusDir(t, "resume", "down", FRAME), "contact");
  assert.equal(focusDir(t, "contact", "up", FRAME), "resume");
  assert.equal(focusDir(t, "resume", "left", FRAME), "about");
  assert.equal(focusDir(t, "contact", "left", FRAME), "about");
});

test("focus at an edge returns null rather than wrapping", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(focusDir(t, "about", "left", FRAME), null);
  assert.equal(focusDir(t, "about", "up", FRAME), null);
});

test("setDir rotates only the container holding the focused pane", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(
    serialize(setDir(t, "resume", "h")),
    "h(about,h(resume,contact))",
  );
  assert.equal(
    serialize(setDir(t, "about", "v")),
    "v(about,v(resume,contact))",
  );
});

test("setDir on a lone leaf is a no-op", () => {
  assert.equal(serialize(setDir(leaf("about"), "about", "v")), "about");
});

test("autoDir splits wide panes into columns and tall panes into rows", () => {
  const wide = { x: 0, y: 0, w: 1600, h: 900 };
  const tall = { x: 0, y: 0, w: 400, h: 900 };
  assert.equal(autoDir(leaf("about"), "about", wide), "h");
  assert.equal(autoDir(leaf("about"), "about", tall), "v");
  // Already split into two columns, each column is now tall -> next opens as a row.
  assert.equal(autoDir(parse("h(about,resume)")!, "about", tall), "v");
});

/* ── shares, resizing ──────────────────────────────────────────────────────*/

test("an unresized layout serialises with no numbers in it", () => {
  assert.equal(
    serialize(parse("h(about,resume,contact)")!),
    "h(about,resume,contact)",
  );
});

test("shares round-trip through the URL", () => {
  const t = parse("h(about:62.5,resume:37.5)")!;
  assert.deepEqual(
    shares(t as Extract<typeof t, { kind: "container" }>),
    [0.625, 0.375],
  );
  assert.equal(serialize(t), "h(about:62.5,resume:37.5)");
});

test("shares normalise, so they need not sum to 100", () => {
  const t = parse("h(about:1,resume:3)")!;
  assert.equal(serialize(t), "h(about:25,resume:75)");
});

test("partially sized containers are malformed, not guessed at", () => {
  assert.equal(parse("h(about:60,resume)"), null);
  assert.equal(parse("h(about:0,resume:100)"), null);
  assert.equal(parse("h(about:abc,resume:50)"), null);
});

test("a sized container survives nesting", () => {
  const s = "h(about:70,v(resume:30,contact:70):30)";
  assert.equal(serialize(parse(s)!), s);
});

test("resize moves one seam and leaves the rest alone", () => {
  const t = parse("h(about,resume,contact)")!;
  const wider = resizeAt(t, [], 0, 0.1);
  assert.equal(serialize(wider), "h(about:43.3,resume:23.3,contact:33.3)");
});

test("resize clamps rather than collapsing a pane", () => {
  const t = parse("h(about,resume)")!;
  const shoved = resizeAt(t, [], 0, 5);
  const parts = shares(shoved as Extract<typeof shoved, { kind: "container" }>);
  assert.ok(Math.abs(parts[1]! - MIN_SHARE) < 1e-9, `got ${parts[1]}`);
  assert.ok(parts[0]! + parts[1]! - 1 < 1e-9);
});

test("resize reaches a nested container by path", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(
    serialize(resizeAt(t, [1], 0, 0.25)),
    "h(about,v(resume:75,contact:25))",
  );
});

test("rects honour shares", () => {
  const t = parse("h(about:75,resume:25)")!;
  const r = rects(t, FRAME);
  assert.deepEqual(r.get("about"), { x: 0, y: 0, w: 750, h: 1000 });
  assert.deepEqual(r.get("resume"), { x: 750, y: 0, w: 250, h: 1000 });
});

test("closing a pane hands its share to the survivors proportionally", () => {
  const t = parse("h(about:20,resume:20,contact:60)")!;
  assert.equal(serialize(close(t, "about")!), "h(resume:25,contact:75)");
});

test("splitting a resized container subdivides the target's slot only", () => {
  const t = parse("h(about:80,resume:20)")!;
  assert.equal(
    serialize(split(t, "about", "h", "work")),
    "h(about:40,work:40,resume:20)",
  );
});

/* ── dividers ──────────────────────────────────────────────────────────────*/

test("one divider sits between each adjacent pair, at the seam", () => {
  const t = parse("h(about,v(resume,contact))")!;
  const seams = dividers(t, FRAME);
  assert.equal(seams.length, 2);

  const outer = seams.find((s) => s.path.length === 0)!;
  assert.equal(outer.dir, "h");
  assert.equal(outer.at, 500); // between the two columns
  assert.deepEqual([outer.from, outer.to], [0, 1000]);

  const inner = seams.find((s) => s.path.length === 1)!;
  assert.equal(inner.dir, "v");
  assert.equal(inner.at, 500); // between the two stacked panes
  assert.deepEqual([inner.from, inner.to], [500, 1000]);
});

test("a single pane has no dividers", () => {
  assert.deepEqual(dividers(leaf("about"), FRAME), []);
});

test("divider ids are stable across a resize", () => {
  const t = parse("h(about,v(resume,contact))")!;
  const before = dividers(t, FRAME).map((s) => s.id);
  const after = dividers(resizeAt(t, [], 0, 0.1), FRAME).map((s) => s.id);
  assert.deepEqual(before, after);
});

test("seamFor picks the seam on the requested side of the focused pane", () => {
  const t = parse("h(about,resume)")!;
  const right = seamFor(t, "about", "right", FRAME)!;
  assert.equal(right.sign, 1);
  assert.equal(right.divider.at, 500);

  const left = seamFor(t, "resume", "left", FRAME)!;
  assert.equal(left.sign, -1);
  assert.equal(left.divider.at, 500);

  assert.equal(seamFor(t, "about", "left", FRAME), null); // outer edge
  assert.equal(seamFor(t, "about", "up", FRAME), null); // wrong axis
});

/* ── swap and move ─────────────────────────────────────────────────────────*/

test("swap exchanges two panes and keeps both slots' sizes", () => {
  const t = parse("h(about:80,resume:20)")!;
  assert.equal(serialize(swap(t, "about", "resume")), "h(resume:80,about:20)");
});

test("swap is a no-op for unknown or identical views", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(serialize(swap(t, "about", "about")), "h(about,resume)");
  assert.equal(serialize(swap(t, "about", "nope")), "h(about,resume)");
});

test("dropping on the centre swaps", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(
    serialize(moveTo(t, "about", "contact", "center")),
    "h(contact,v(resume,about))",
  );
});

test("dropping on an edge pulls the pane out and re-splits there", () => {
  const t = parse("h(about,v(resume,contact))")!;
  assert.equal(
    serialize(moveTo(t, "about", "contact", "bottom")),
    "v(resume,contact,about)",
  );
  assert.equal(
    serialize(moveTo(t, "about", "resume", "top")),
    "v(about,resume,contact)",
  );
});

test("dropping to the side of a pane in a column nests a row", () => {
  const t = parse("v(about,resume,contact)")!;
  assert.equal(
    serialize(moveTo(t, "about", "contact", "right")),
    "v(resume,h(contact,about))",
  );
});

test("move never loses or duplicates a pane", () => {
  const t = parse("h(about,v(resume,contact),work)")!;
  for (const edge of ["center", "left", "right", "top", "bottom"] as const) {
    const moved = moveTo(t, "work", "resume", edge);
    assert.deepEqual(
      views(moved).sort(),
      ["about", "contact", "resume", "work"],
      `edge ${edge}`,
    );
  }
});

test("move onto itself, or with an unknown view, changes nothing", () => {
  const t = parse("h(about,resume)")!;
  assert.equal(
    serialize(moveTo(t, "about", "about", "left")),
    "h(about,resume)",
  );
  assert.equal(
    serialize(moveTo(t, "about", "nope", "left")),
    "h(about,resume)",
  );
  assert.equal(
    serialize(moveTo(leaf("about"), "about", "about", "left")),
    "about",
  );
});

test("every move produces a tree the URL can describe", () => {
  const t = parse("h(about:60,v(resume,contact):40)")!;
  for (const edge of ["center", "left", "right", "top", "bottom"] as const) {
    const moved = moveTo(t, "about", "contact", edge);
    assert.equal(
      serialize(parse(serialize(moved))!),
      serialize(moved),
      `edge ${edge}`,
    );
  }
});
