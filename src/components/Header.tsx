import { NAV_LINKS } from "@/lib/constants";
import Link from "next/link";

const Header = () => {
  const navLinks = NAV_LINKS;

  return (
    <header className="container h-24 flex items-center justify-between">
      <nav className="flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium hover:underline underline-offset-8"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
