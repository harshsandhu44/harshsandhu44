import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedShinyText } from '../animated-shiny-text';

describe('AnimatedShinyText', () => {
  it('renders with children text', () => {
    render(<AnimatedShinyText>Shiny Text</AnimatedShinyText>);

    const element = screen.getByText('Shiny Text');
    expect(element).toBeInTheDocument();
    expect(element.tagName.toLowerCase()).toBe('span');
  });

  it('applies default shimmer width CSS variable', () => {
    render(<AnimatedShinyText>Default Shimmer</AnimatedShinyText>);

    const element = screen.getByText('Default Shimmer');
    expect(element).toHaveStyle({ '--shiny-width': '40px' });
  });

  it('applies custom shimmer width CSS variable', () => {
    render(
      <AnimatedShinyText shimmerWidth={60}>Custom Shimmer</AnimatedShinyText>
    );

    const element = screen.getByText('Custom Shimmer');
    expect(element).toHaveStyle({ '--shiny-width': '60px' });
  });

  it('applies default CSS classes', () => {
    render(<AnimatedShinyText>Styled Text</AnimatedShinyText>);

    const element = screen.getByText('Styled Text');
    expect(element).toHaveClass(
      'mx-auto',
      'max-w-md',
      'text-neutral-600/70',
      'dark:text-neutral-400/70',
      'animate-shiny-text',
      'bg-clip-text',
      'bg-no-repeat'
    );
  });

  it('merges custom className with default classes', () => {
    render(
      <AnimatedShinyText className="custom-class">
        Custom Class Text
      </AnimatedShinyText>
    );

    const element = screen.getByText('Custom Class Text');
    expect(element).toHaveClass('custom-class');
    expect(element).toHaveClass('mx-auto'); // still has default classes
  });

  it('forwards additional props to span element', () => {
    render(
      <AnimatedShinyText
        id="shiny-text"
        title="Shiny tooltip"
        data-testid="animated-text"
      >
        Props Text
      </AnimatedShinyText>
    );

    const element = screen.getByTestId('animated-text');
    expect(element).toHaveAttribute('id', 'shiny-text');
    expect(element).toHaveAttribute('title', 'Shiny tooltip');
    expect(element).toHaveTextContent('Props Text');
  });

  it('handles zero shimmer width', () => {
    render(
      <AnimatedShinyText shimmerWidth={0}>Zero Shimmer</AnimatedShinyText>
    );

    const element = screen.getByText('Zero Shimmer');
    expect(element).toHaveStyle({ '--shiny-width': '0px' });
  });

  it('handles large shimmer width', () => {
    render(
      <AnimatedShinyText shimmerWidth={200}>Large Shimmer</AnimatedShinyText>
    );

    const element = screen.getByText('Large Shimmer');
    expect(element).toHaveStyle({ '--shiny-width': '200px' });
  });

  it('supports complex children', () => {
    const { container } = render(
      <AnimatedShinyText>
        <strong>Bold</strong> and <em>italic</em> text
      </AnimatedShinyText>
    );

    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    // Check that the container has the expected combined text content
    const span = container.querySelector('span');
    expect(span?.textContent).toBe('Bold and italic text');
  });

  it('applies gradient background classes', () => {
    render(<AnimatedShinyText>Gradient Text</AnimatedShinyText>);

    const element = screen.getByText('Gradient Text');
    expect(element).toHaveClass(
      'bg-gradient-to-r',
      'from-transparent',
      'via-black/80',
      'via-50%',
      'to-transparent',
      'dark:via-white/80'
    );
  });

  it('applies animation and background classes', () => {
    render(<AnimatedShinyText>Animated Text</AnimatedShinyText>);

    const element = screen.getByText('Animated Text');
    expect(element).toHaveClass(
      'animate-shiny-text',
      'bg-clip-text',
      'bg-no-repeat'
    );
  });
});
