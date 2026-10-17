import { ImageResponse } from "next/og";
import { Mark, marks } from "@/wordmark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// H monogram in the DX Brutalist outline, red on a carbon tile. Hex = globals.css accent/ink.
export default function Icon() {
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
      }}
    >
      <Mark m={marks.h} width={marks.h.w * 0.26} height={marks.h.h * 0.26} />
    </div>,
    size,
  );
}
