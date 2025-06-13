import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../footer';

describe('Footer', () => {
  it('renders the footer component', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('py-4');
  });

  it('displays current year in copyright', () => {
    const currentYear = new Date().getFullYear();
    render(<Footer />);

    expect(
      screen.getByText(
        new RegExp(`©\\s*${currentYear}.*Harsh Sandhu.*All rights reserved`)
      )
    ).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<Footer />);

    const container = screen
      .getByRole('contentinfo')
      .querySelector('.container');
    expect(container).toHaveClass('text-center');

    const paragraph = screen.getByText(/Harsh Sandhu/);
    expect(paragraph).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('displays correct copyright text structure', () => {
    render(<Footer />);

    const copyrightText = screen.getByText(
      /©.*Harsh Sandhu.*All rights reserved/
    );
    expect(copyrightText).toBeInTheDocument();
  });
});
