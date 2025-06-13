import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Harsh Sandhu - Indie Developer',
  description:
    'An Indie Developer from India. Working on building a legacy and make an impact on humanity.',
};

export default function RootLayout({
  children,
}: Readonly<React.PropsWithChildren>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
