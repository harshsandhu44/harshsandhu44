import { ImageResponse } from "next/og";
import { site } from "@/content";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hex approximations of the ivory / organic / apricot oklch tokens in globals.css.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: "#f5e6c5",
          color: "#3f422e",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>{site.name}</div>
        <div style={{ fontSize: 40, marginTop: 16, borderBottom: "6px solid #d78b30", paddingBottom: 12 }}>
          {site.role}
        </div>
      </div>
    ),
    size,
  );
}
