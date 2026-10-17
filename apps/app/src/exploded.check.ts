// Self-check for the case-study exploded drawings. Run: node src/exploded.check.ts
import assert from "node:assert/strict";
import { products } from "./content.ts";
import { LAYERS, layout } from "./exploded.ts";

for (const p of products) {
  if (!p.arch) continue;
  const { parts, links } = p.arch;
  const ids = new Set(parts.map((x) => x.id));
  assert.equal(ids.size, parts.length, `${p.slug}: part ids are unique`);
  assert.ok(parts.length <= 9, `${p.slug}: at most 9 parts, so the balloons stay legible`);
  for (const [a, b] of links) assert.ok(ids.has(a) && ids.has(b), `${p.slug}: link ${a}→${b}`);
  // Balloon numbers follow `parts` order and the list follows layers; they only agree if sorted.
  const rank = parts.map((x) => LAYERS.indexOf(x.layer));
  assert.deepEqual(
    rank,
    [...rank].sort((x, y) => x - y),
    `${p.slug}: parts listed top layer first`,
  );

  // Fully exploded, no two parts touch.
  const boxes = layout(parts, 1);
  boxes.forEach((m, i) =>
    boxes.slice(i + 1).forEach((n, k) => {
      const apart =
        Math.abs(m.x - n.x) >= (m.w + n.w) / 2 || Math.abs(m.y - n.y) >= (m.h + n.h) / 2;
      assert.ok(apart, `${p.slug}: ${parts[i]!.id} and ${parts[i + k + 1]!.id} overlap`);
    }),
  );
  // Assembled, the layers stack: each one sits below the last.
  const at0 = layout(parts, 0);
  const tops = LAYERS.map((l) => at0.find((_, i) => parts[i]!.layer === l)?.y).filter(
    (y) => y !== undefined,
  );
  assert.deepEqual(
    tops,
    [...tops].sort((x, y) => y - x),
    `${p.slug}: layers stack downwards`,
  );
}

console.log("exploded: ok");
