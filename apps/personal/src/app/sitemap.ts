import type { MetadataRoute } from "next";
import { SECTIONS } from "../components/wm/views";

const BASE = "https://harshsandhu.com";

/* Only the bare section paths. A `?l=` layout is the same content arranged
 * differently, so indexing those would be duplicate content wearing a hat. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    ...SECTIONS.map((section) => ({
      url: `${BASE}/${section.view}`,
      priority: 0.8,
    })),
  ];
}
