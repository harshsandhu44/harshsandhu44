import localFont from "next/font/local";

/** Stack Sans Headline — headings only. Body text uses Geist. */
export const stackSans = localFont({
  src: "./StackSansHeadline.woff2",
  variable: "--font-stack-sans",
  weight: "200 700",
  display: "swap",
});
