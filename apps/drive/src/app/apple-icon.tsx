import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// icon.svg on a square carbon tile: iOS rounds the corners itself. Hex = globals.css ink.
export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), "src/app/icon.svg"), "base64");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#15151e" }}>
      <img src={`data:image/svg+xml;base64,${svg}`} width={180} height={180} alt="" />
    </div>,
    size,
  );
}
