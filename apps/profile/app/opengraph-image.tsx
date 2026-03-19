import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "Harsh Sandhu - Product Engineer";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        background: "#111111",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #333",
          padding: "40px 60px",
          borderRadius: "20px",
          backgroundColor: "#1a1a1a",
        }}
      >
        <div
          style={{
            fontSize: 80,
            color: "#F5F5F7",
            marginBottom: 20,
            fontWeight: 700,
          }}
        >
          Harsh Sandhu
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#888888",
            textAlign: "center",
          }}
        >
          Product Engineer
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#666666",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Developer tools · Simulation systems · Fast web products
        </div>
        <div
          style={{
            marginTop: 30,
            padding: "10px 20px",
            backgroundColor: "#FF6B35",
            color: "white",
            borderRadius: "50px",
            fontSize: 24,
          }}
        >
          harshsandhu.com
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
