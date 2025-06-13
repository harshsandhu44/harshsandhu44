import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../header';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

// Mock the constants file
vi.mock('@/lib/constants', () => ({
  NAV_LINKS: [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/projects', label: 'Projects' },
  ],
}));

// Mock the AnimatedShinyText component
vi.mock('@/components/ui/animated-shiny-text', () => ({
  AnimatedShinyText: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

describe('Header', () => {
  it('renders the header with brand name', () => {
    render(<Header />);

    expect(screen.getByText('HSandhu')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Blog')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('applies active link styling to current path', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/blog');

    render(<Header />);

    const blogLink = screen.getByText('Blog');
    expect(blogLink).toHaveClass('underline', 'underline-offset-4');
  });
});
