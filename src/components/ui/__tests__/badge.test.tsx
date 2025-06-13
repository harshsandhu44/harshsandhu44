import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, badgeVariants } from '../badge';

describe('Badge', () => {
  it('renders a badge with default props', () => {
    render(<Badge>Badge Text</Badge>);

    const badge = screen.getByText('Badge Text');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge.tagName.toLowerCase()).toBe('span');
  });

  it('renders with custom className', () => {
    render(<Badge className="custom-badge">Custom Badge</Badge>);

    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('forwards props to the span element', () => {
    render(
      <Badge title="Badge title" id="test-badge">
        Test Badge
      </Badge>
    );

    const badge = screen.getByText('Test Badge');
    expect(badge).toHaveAttribute('title', 'Badge title');
    expect(badge).toHaveAttribute('id', 'test-badge');
  });

  describe('variants', () => {
    it('renders default variant', () => {
      render(<Badge variant="default">Default Badge</Badge>);

      const badge = screen.getByText('Default Badge');
      expect(badge).toHaveClass(
        'bg-primary',
        'text-primary-foreground',
        'border-transparent'
      );
    });

    it('renders secondary variant', () => {
      render(<Badge variant="secondary">Secondary Badge</Badge>);

      const badge = screen.getByText('Secondary Badge');
      expect(badge).toHaveClass(
        'bg-secondary',
        'text-secondary-foreground',
        'border-transparent'
      );
    });

    it('renders destructive variant', () => {
      render(<Badge variant="destructive">Destructive Badge</Badge>);

      const badge = screen.getByText('Destructive Badge');
      expect(badge).toHaveClass(
        'bg-destructive',
        'text-white',
        'border-transparent'
      );
    });

    it('renders outline variant', () => {
      render(<Badge variant="outline">Outline Badge</Badge>);

      const badge = screen.getByText('Outline Badge');
      expect(badge).toHaveClass('text-foreground');
      expect(badge).not.toHaveClass('border-transparent');
    });
  });

  describe('asChild prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Badge asChild>
          <a href="/badge-link">Link Badge</a>
        </Badge>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/badge-link');
      expect(link).toHaveTextContent('Link Badge');
      expect(link).toHaveAttribute('data-slot', 'badge');
    });

    it('renders as span when asChild is false', () => {
      render(<Badge asChild={false}>Regular Badge</Badge>);

      const badge = screen.getByText('Regular Badge');
      expect(badge.tagName.toLowerCase()).toBe('span');
      expect(badge).toHaveTextContent('Regular Badge');
    });
  });

  describe('badgeVariants', () => {
    it('returns correct class names for default variant', () => {
      const classes = badgeVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('returns correct class names for custom variant', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('text-white');
    });

    it('includes custom className', () => {
      const classes = badgeVariants({ className: 'custom-class' });
      expect(classes).toContain('custom-class');
    });

    it('includes base classes', () => {
      const classes = badgeVariants();
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('border');
      expect(classes).toContain('px-2');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('font-medium');
    });
  });

  it('supports children elements', () => {
    render(
      <Badge>
        <span>Icon</span>
        Badge with icon
      </Badge>
    );

    const badge = screen.getByText('Badge with icon');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });
});
