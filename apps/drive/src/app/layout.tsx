import type { Metadata } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Archivo is only ever set italic, at the widest point of its width axis (see `disp`).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: "italic",
  axes: ["wdth"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drive",
  description: "Race an F1 car round the calendar, from Monza and Spa to Monaco and Las Vegas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${hanken.variable}`}>
      <body className="bg-ink font-sans text-lg leading-normal">{children}</body>
    </html>
  );
}
