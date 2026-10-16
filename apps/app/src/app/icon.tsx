import { ImageResponse } from "next/og";
import { googleFont } from "@/google-font";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// H monogram in the display face, red on a carbon tile. Hex = globals.css accent/ink.
export default async function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#15151e",
        borderRadius: 6,
        color: "#e10600",
        fontFamily: "Archivo",
        fontSize: 24,
      }}
    >
      H
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Archivo",
          data: await googleFont("Archivo:ital,wdth,wght@1,125,800", "H"),
          weight: 800,
          style: "italic",
        },
      ],
    },
  );
}
