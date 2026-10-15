import { ImageResponse } from "next/og";
import { site } from "@/content";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori needs a static TTF: Google Fonts serves one instance per family/axes/text request.
async function font(family: string, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`,
    )
  ).text();
  const url = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1];
  if (!url) throw new Error(`No TTF for ${family}`);
  return (await fetch(url)).arrayBuffer();
}

const SQ = 40; // chequer square, px

// Carbon card with the footer's chequered flag and the display wordmark. Hex = globals.css tokens.
export default async function OpengraphImage() {
  const [archivo, hanken] = await Promise.all([
    font("Archivo:ital,wdth,wght@1,125,800", site.name),
    font("Hanken+Grotesk:wght@500", site.role),
  ]);
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
        <div style={{ fontFamily: "Archivo", fontSize: 136, lineHeight: 0.92, letterSpacing: -4 }}>
          {site.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 36 }}>
          <div style={{ width: 72, height: 12, background: "#e10600" }} />
          <div style={{ fontFamily: "Hanken", fontSize: 40, color: "#a9a9b3" }}>{site.role}</div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "italic" },
        { name: "Hanken", data: hanken, weight: 500, style: "normal" },
      ],
    },
  );
}
