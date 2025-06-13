'use client';

import { AnimatedShinyText } from '@/components/ui/animated-shiny-text';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  const navLinks = NAV_LINKS;

  return (
    <header className="container h-24 flex items-center justify-between sticky top-0 bg-background z-10">
      <h1 className="font-bold text-primary">
        <AnimatedShinyText>HSandhu</AnimatedShinyText>
      </h1>

      <nav className="flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-sm font-medium',
              pathname === link.href && 'underline underline-offset-4'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
