# GitHub Actions Workflows

This repository includes several GitHub Actions workflows for continuous integration and quality assurance.

## Workflows

### 1. Tests (`test.yml`)

**Triggers:** Pull requests to `main`/`develop` branches, pushes to `main`

**What it does:**

- Runs on Node.js 18.x and 20.x (matrix strategy)
- Installs dependencies with `npm ci`
- Runs ESLint for code quality
- Executes all tests with `npm run test:run`
- Builds the project to ensure it compiles
- Uploads test results and coverage as artifacts

### 2. Test Coverage (`coverage.yml`)

**Triggers:** Pull requests to `main`

**What it does:**

- Runs test coverage analysis
- Uploads coverage reports to Codecov (if configured)
- Provides detailed insight into test coverage

## Setting Up Branch Protection

To enforce these checks before merging, add these as required status checks in your repository settings:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require status checks to pass before merging"
4. Add these required checks:
   - `test (18.x)`
   - `test (20.x)`
   - `quick-check`
   - `coverage`

## Codecov Integration (Optional)

To enable coverage reporting:

1. Sign up at [codecov.io](https://codecov.io)
2. Add your repository
3. Add `CODECOV_TOKEN` to your repository secrets
4. Coverage reports will be automatically uploaded

## Local Development

Before pushing, you can run the same checks locally:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Tests
npm run test:run

# Coverage
npm run test:coverage

# Build
npm run build
```
