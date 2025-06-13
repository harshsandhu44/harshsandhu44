# Testing Setup

This project uses [Vitest](https://vitest.dev/) for testing, along with React Testing Library for component tests.

## Scripts

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests and generate coverage report

## Test Structure

- Component tests are located in `__tests__` directories next to the components
- Utility tests are in `src/lib/__tests__/`
- Test setup is configured in `src/test/setup.ts`

## Writing Tests

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Utility Tests

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '../utils';

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('expected output');
  });
});
```

## Mocking

The setup includes mocks for common browser APIs:

- `IntersectionObserver`
- `ResizeObserver`
- `matchMedia`

For Next.js specific features, mock them in individual test files as needed.
