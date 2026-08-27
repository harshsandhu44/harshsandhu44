import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getProfile } from "#lib/content";

export const alt = "Harsh Sandhu — Product Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (weight: "Regular" | "Medium") =>
  readFile(
    join(
      process.cwd(),
      "node_modules/geist/dist/fonts/geist-mono",
      `GeistMono-${weight}.ttf`,
    ),
  );

/* The share card is one pane of the site, lifted out: same board, same header
 * rule, same three lines of type. Someone who clicks through should recognise
 * where they landed. */
export default async function OpengraphImage() {
  const [profile, regular, medium] = await Promise.all([
    getProfile(),
    font("Regular"),
    font("Medium"),
  ]);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#0B1410",
        padding: 48,
        fontFamily: "Geist Mono",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          background: "#10201A",
          border: "1px solid #1E3428",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "#16291F",
            borderBottom: "2px solid #D59969",
            padding: "14px 22px",
            fontSize: 20,
            letterSpacing: 2,
            color: "#98AA9E",
          }}
        >
          <span>~/HARSHSANDHU.COM</span>
          <span>{profile.location.split(",").pop()?.trim().toUpperCase()}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: 18,
            padding: "0 56px",
          }}
        >
          <div style={{ fontSize: 86, fontWeight: 500, color: "#E9EDEA" }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 34, color: "#98AA9E" }}>{profile.role}</div>
          <div style={{ fontSize: 28, color: "#E2B858" }}>
            {profile.tagline}
          </div>
        </div>

        {/* A trace leaving the pad: the one ornament, and it is the subject. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 56px 44px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#D59969",
            }}
          />
          <div
            style={{
              display: "flex",
              height: 2,
              width: 420,
              background: "#D59969",
            }}
          />
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              borderRadius: 5,
              background: "#D59969",
            }}
          />
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist Mono", data: regular, weight: 400, style: "normal" },
        { name: "Geist Mono", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
