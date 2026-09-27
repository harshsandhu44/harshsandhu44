import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { site } from "@/content";
import { BotAvatar } from "@/components/bot-avatar";
import { CrosshairCursor } from "@/components/crosshair-cursor";
import { Rail } from "@/components/rail";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}, ${site.role}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${bricolage.variable} antialiased`}>
      <body className="min-h-dvh">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <BotAvatar type="ghost" size={32} jumpEvery={0} />
            <Link href="/" className="font-heading text-lg font-semibold">
              {site.name}
            </Link>
          </div>
          <a href={`mailto:${site.email}`} className="link">
            Email me
          </a>
        </header>
        <Rail />
        <CrosshairCursor />
        {children}
      </body>
    </html>
  );
}
