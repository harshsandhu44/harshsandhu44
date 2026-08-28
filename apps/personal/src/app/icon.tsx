import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* The mark is the tiling split itself: two panes with the board showing through
 * the gutter, the focused one carrying its copper rule. Letterforms turn to
 * mush at 16px in a tab strip, and a single window outline reads as any app at
 * all — a split square reads as this one. */
export default function Icon() {
  const pane = (flex: number, focused: boolean) => (
    <div
      key={flex}
      style={{
        display: "flex",
        flexDirection: "column",
        flex,
        background: "#22392C",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 4,
          background: focused ? "#D59969" : "#4A6555",
        }}
      />
    </div>
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#0B1410",
        padding: 3,
        gap: 3,
      }}
    >
      {pane(17, true)}
      {pane(10, false)}
    </div>,
    size,
  );
}
