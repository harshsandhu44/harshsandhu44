import { describe, it, expect } from 'vitest';
import { useMDXComponents } from '../mdx-components';

describe('useMDXComponents', () => {
  it('returns the provided components unchanged', () => {
    const mockComponents = {
      h1: 'h1',
      h2: 'h2',
      p: 'p',
    };

    const result = useMDXComponents(mockComponents);

    expect(result).toEqual(mockComponents);
  });

  it('returns empty object when given empty object', () => {
    const result = useMDXComponents({});

    expect(result).toEqual({});
  });

  it('preserves all component properties', () => {
    const complexComponents = {
      h1: ({ children }: { children: React.ReactNode }) => (
        <h1 className="custom">{children}</h1>
      ),
      p: ({ children }: { children: React.ReactNode }) => (
        <p className="paragraph">{children}</p>
      ),
      code: ({ children }: { children: React.ReactNode }) => (
        <code className="code">{children}</code>
      ),
      blockquote: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="quote">{children}</blockquote>
      ),
    };

    const result = useMDXComponents(complexComponents);

    expect(result).toEqual(complexComponents);
    expect(result.h1).toBe(complexComponents.h1);
    expect(result.p).toBe(complexComponents.p);
    expect(result.code).toBe(complexComponents.code);
    expect(result.blockquote).toBe(complexComponents.blockquote);
  });

  it('maintains function reference equality', () => {
    const components = {
      h1: 'h1',
      CustomComponent: () => <div>Custom</div>,
    };

    const result = useMDXComponents(components);

    // The function should maintain reference equality
    expect(result.CustomComponent).toBe(components.CustomComponent);
  });

  it('handles function components', () => {
    const functionComponents = {
      div: 'div',
      Button: () => <button>Click me</button>,
    };

    const result = useMDXComponents(functionComponents);

    expect(result).toEqual(functionComponents);
    expect(typeof result.div).toBe('string');
    expect(typeof result.Button).toBe('function');
  });

  it('returns an object with spread components', () => {
    const baseComponents = { h1: 'h1', p: 'p' };
    const result = useMDXComponents(baseComponents);

    // Should return a new object (spread operation creates new object)
    expect(result).toEqual(baseComponents);
    expect(result).not.toBe(baseComponents); // Different object reference due to spread
  });
});
