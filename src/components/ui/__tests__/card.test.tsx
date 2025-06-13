import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders a card element', () => {
      render(<Card>Card content</Card>);

      const card = screen.getByText('Card content');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-slot', 'card');
      expect(card.tagName.toLowerCase()).toBe('div');
    });

    it('applies default classes', () => {
      render(<Card>Styled card</Card>);

      const card = screen.getByText('Styled card');
      expect(card).toHaveClass(
        'bg-card',
        'text-card-foreground',
        'flex',
        'flex-col',
        'gap-6',
        'rounded-xl',
        'border',
        'py-6',
        'shadow-sm'
      );
    });

    it('merges custom className', () => {
      render(<Card className="custom-card">Custom card</Card>);

      const card = screen.getByText('Custom card');
      expect(card).toHaveClass('custom-card');
      expect(card).toHaveClass('bg-card'); // still has default classes
    });
  });

  describe('CardHeader', () => {
    it('renders a card header', () => {
      render(<CardHeader>Header content</CardHeader>);

      const header = screen.getByText('Header content');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'card-header');
    });

    it('applies default header classes', () => {
      render(<CardHeader>Header</CardHeader>);

      const header = screen.getByText('Header');
      expect(header).toHaveClass(
        '@container/card-header',
        'grid',
        'auto-rows-min',
        'items-start',
        'gap-1.5',
        'px-6'
      );
    });
  });

  describe('CardTitle', () => {
    it('renders a card title', () => {
      render(<CardTitle>Title text</CardTitle>);

      const title = screen.getByText('Title text');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'card-title');
    });

    it('applies title classes', () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByText('Title');
      expect(title).toHaveClass('leading-snug', 'font-semibold');
    });
  });

  describe('CardDescription', () => {
    it('renders a card description', () => {
      render(<CardDescription>Description text</CardDescription>);

      const description = screen.getByText('Description text');
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'card-description');
    });

    it('applies description classes', () => {
      render(<CardDescription>Description</CardDescription>);

      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
    });
  });

  describe('CardAction', () => {
    it('renders a card action', () => {
      render(<CardAction>Action content</CardAction>);

      const action = screen.getByText('Action content');
      expect(action).toBeInTheDocument();
      expect(action).toHaveAttribute('data-slot', 'card-action');
    });

    it('applies action classes', () => {
      render(<CardAction>Action</CardAction>);

      const action = screen.getByText('Action');
      expect(action).toHaveClass(
        'col-start-2',
        'row-span-2',
        'row-start-1',
        'self-start',
        'justify-self-end'
      );
    });
  });

  describe('CardContent', () => {
    it('renders card content', () => {
      render(<CardContent>Content text</CardContent>);

      const content = screen.getByText('Content text');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-slot', 'card-content');
    });

    it('applies content classes', () => {
      render(<CardContent>Content</CardContent>);

      const content = screen.getByText('Content');
      expect(content).toHaveClass('px-6');
    });
  });

  describe('CardFooter', () => {
    it('renders card footer', () => {
      render(<CardFooter>Footer content</CardFooter>);

      const footer = screen.getByText('Footer content');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'card-footer');
    });

    it('applies footer classes', () => {
      render(<CardFooter>Footer</CardFooter>);

      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('flex', 'items-center', 'px-6');
    });
  });

  describe('Complete card structure', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <span>Footer content</span>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card description')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });

  describe('prop forwarding', () => {
    it('forwards props to all components', () => {
      render(
        <div>
          <Card id="card" title="Card title">
            Card
          </Card>
          <CardHeader id="header" title="Header title">
            Header
          </CardHeader>
          <CardTitle id="title" title="Title title">
            Title
          </CardTitle>
          <CardDescription id="desc" title="Desc title">
            Description
          </CardDescription>
          <CardAction id="action" title="Action title">
            Action
          </CardAction>
          <CardContent id="content" title="Content title">
            Content
          </CardContent>
          <CardFooter id="footer" title="Footer title">
            Footer
          </CardFooter>
        </div>
      );

      expect(screen.getByText('Card')).toHaveAttribute('id', 'card');
      expect(screen.getByText('Header')).toHaveAttribute('id', 'header');
      expect(screen.getByText('Title')).toHaveAttribute('id', 'title');
      expect(screen.getByText('Description')).toHaveAttribute('id', 'desc');
      expect(screen.getByText('Action')).toHaveAttribute('id', 'action');
      expect(screen.getByText('Content')).toHaveAttribute('id', 'content');
      expect(screen.getByText('Footer')).toHaveAttribute('id', 'footer');
    });
  });
});
