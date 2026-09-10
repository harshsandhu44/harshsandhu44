import type { Metadata } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
});

const description =
  "Harsh Sandhu is a Product Engineer working across full-stack product development, AI-powered applications, simulation systems, and consumer software — presented as a walkable pixel-art farm.";

export const metadata: Metadata = {
  title: "Harshsandhu44 — Product Engineer",
  description,
  openGraph: {
    title: "Harshsandhu44 — Product Engineer",
    description,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${vt323.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
