/* Run: node --test src/components/wm/tree.test.ts
 * No framework. The tree is the one piece of real logic on this site, so it is
 * the one piece that gets a check. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  leaf,
  parse,
  serialize,
  split,
  close,
  rects,
  focusDir,
  setDir,
  autoDir,
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
