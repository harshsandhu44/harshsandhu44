import { ImageResponse } from "next/og";
import { site } from "@/content";
import { googleFont } from "@/google-font";
import { Mark, marks } from "@/wordmark";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SQ = 40; // chequer square, px

// Carbon card with the footer's chequered flag and the outlined wordmark. Hex = globals.css tokens.
export default async function OpengraphImage() {
  const hanken = await googleFont("Hanken+Grotesk:wght@500", site.role);
  const row = (offset: number) => (
    <div style={{ display: "flex" }}>
      {Array.from({ length: size.width / SQ }, (_, i) => (
        <div
          key={i}
          style={{ width: SQ, height: SQ, background: (i + offset) % 2 ? "#15151e" : "#f7f7f7" }}
        />
      ))}
    </div>
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#15151e",
        color: "#f7f7f7",
      }}
    >
      {row(0)}
      {row(1)}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          flex: 1,
          padding: 72,
        }}
      >
        <Mark m={marks.full} width={marks.full.w * 1.4} height={marks.full.h * 1.4} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36 }}>
          <div style={{ width: 72, height: 12, background: "#e10600" }} />
          <div style={{ fontFamily: "Hanken", fontSize: 40, color: "#a9a9b3" }}>{site.role}</div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Hanken", data: hanken, weight: 500, style: "normal" }],
    },
  );
}
