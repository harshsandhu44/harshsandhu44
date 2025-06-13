import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(input.tagName.toLowerCase()).toBe('input');
  });

  it('renders with default type text', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    // HTML input elements default to type="text" even when not explicitly set
    expect(input.getAttribute('type')).toBeNull(); // DOM doesn't set type="text" by default
  });

  it('renders with custom type', () => {
    render(<Input type="email" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with password type', () => {
    render(<Input type="password" data-testid="password-input" />);

    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('applies default CSS classes', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'flex',
      'h-9',
      'w-full',
      'min-w-0',
      'rounded-md',
      'border',
      'bg-transparent',
      'px-3',
      'py-1',
      'text-base',
      'shadow-xs',
      'outline-none'
    );
  });

  it('merges custom className with defaults', () => {
    render(<Input className="custom-input" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
    expect(input).toHaveClass('flex'); // still has default classes
  });

  it('forwards props to input element', () => {
    render(<Input placeholder="Enter text" id="test-input" name="testField" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter text');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'testField');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass(
      'disabled:pointer-events-none',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    );
  });

  it('handles value and onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(handleChange).toHaveBeenCalled();
  });

  it('applies focus styles classes', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'focus-visible:border-ring',
      'focus-visible:ring-ring/50',
      'focus-visible:ring-[3px]'
    );
  });

  it('applies invalid state classes', () => {
    render(<Input aria-invalid="true" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'aria-invalid:ring-destructive/20',
      'dark:aria-invalid:ring-destructive/40',
      'aria-invalid:border-destructive'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies placeholder styles', () => {
    render(<Input placeholder="Test placeholder" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('placeholder:text-muted-foreground');
  });

  it('applies file input styles', () => {
    render(<Input type="file" data-testid="file-input" />);

    const input = screen.getByTestId('file-input');
    expect(input).toHaveClass(
      'file:text-foreground',
      'file:inline-flex',
      'file:h-7',
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium'
    );
  });

  it('applies selection styles', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'selection:bg-primary',
      'selection:text-primary-foreground'
    );
  });

  it('applies dark mode styles', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('dark:bg-input/30');
  });

  it('applies border styles', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-input');
  });

  it('supports all input types', () => {
    const inputTypes: Array<React.HTMLInputTypeAttribute> = [
      'text',
      'email',
      'password',
      'number',
      'search',
      'tel',
      'url',
    ];

    inputTypes.forEach((type) => {
      const { unmount } = render(
        <Input type={type} data-testid={`input-${type}`} />
      );
      const input = screen.getByTestId(`input-${type}`);
      expect(input).toHaveAttribute('type', type);
      unmount();
    });
  });
});
