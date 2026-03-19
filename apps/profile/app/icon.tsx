import { ImageResponse } from "next/og";

export const runtime = "edge";

// You can change sizes; 32 is typical favicon size.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 375 375"
        width="48"
        height="48"
      >
        <defs>
          <clipPath id="a">
            <path d="M0 0h239v315H0z" />
          </clipPath>
        </defs>

        <g clipPath="url(#a)" transform="translate(68 56)">
          <path
            d="M50.519 16.713q11.561 0 16.266 10.953l46.906 115.718L87.738 41.416q-1.253-4.687-.156-9.063a22.4 22.4 0 0 1 3.75-7.969q2.655-3.608 6.562-5.64 3.904-2.03 8.61-2.031h122.281V235.65h-88.5q-9.082.001-11.11-8.594-2.034-8.606 2.97-22.375l20.64-56.297-41.594 71.626q-4.065 6.893-10.172 11.266-6.094 4.375-13.906 4.374H10.176V16.713Zm0 0"
            fill="#e45727"
          />
        </g>
      </svg>
    </div>,
    size,
  );
}

