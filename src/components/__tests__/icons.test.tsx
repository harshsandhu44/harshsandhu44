import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GithubIcon, InstagramIcon } from '../icons';

describe('Icons', () => {
  describe('GithubIcon', () => {
    it('renders the Github icon', () => {
      render(<GithubIcon data-testid="github-icon" />);

      const icon = screen.getByTestId('github-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.tagName).toBe('svg');
    });

    it('has correct default attributes', () => {
      render(<GithubIcon data-testid="github-icon" />);

      const icon = screen.getByTestId('github-icon');
      expect(icon).toHaveAttribute('width', '800');
      expect(icon).toHaveAttribute('height', '800');
      expect(icon).toHaveAttribute('fill', 'inherit');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('accepts custom props', () => {
      render(
        <GithubIcon
          data-testid="github-icon"
          width={24}
          height={24}
          className="custom-class"
        />
      );

      const icon = screen.getByTestId('github-icon');
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
      expect(icon).toHaveClass('custom-class');
    });

    it('contains the Github path', () => {
      render(<GithubIcon data-testid="github-icon" />);

      const icon = screen.getByTestId('github-icon');
      const path = icon.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path?.getAttribute('d')).toContain('M12 0a12 12 0 1 0 0 24');
    });
  });

  describe('InstagramIcon', () => {
    it('renders the Instagram icon', () => {
      render(<InstagramIcon data-testid="instagram-icon" />);

      const icon = screen.getByTestId('instagram-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.tagName).toBe('svg');
    });

    it('has correct default attributes', () => {
      render(<InstagramIcon data-testid="instagram-icon" />);

      const icon = screen.getByTestId('instagram-icon');
      expect(icon).toHaveAttribute('width', '800');
      expect(icon).toHaveAttribute('height', '800');
      expect(icon).toHaveAttribute('fill', 'inherit');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('accepts custom props', () => {
      render(
        <InstagramIcon
          data-testid="instagram-icon"
          width={32}
          height={32}
          className="instagram-custom"
        />
      );

      const icon = screen.getByTestId('instagram-icon');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
      expect(icon).toHaveClass('instagram-custom');
    });

    it('contains the Instagram path with fillRule', () => {
      render(<InstagramIcon data-testid="instagram-icon" />);

      const icon = screen.getByTestId('instagram-icon');
      const path = icon.querySelector('path');
      expect(path).toBeInTheDocument();
      // In DOM, fillRule is transformed to fill-rule
      expect(path?.getAttribute('fill-rule')).toBe('evenodd');
      expect(path?.getAttribute('d')).toContain('M10.825 2h2.349c1.675.004');
    });
  });
});
