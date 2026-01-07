# Contributing to StoryBoard

Thank you for your interest in contributing to StoryBoard! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/storyboard.git
   cd storyboard
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Run database migrations:

   ```bash
   npm run migrate
   npm run seed
   ```

5. Start development servers:

   ```bash
   npm run dev:all
   ```

   This starts both the Vite dev server (frontend) and Express server (backend) concurrently.

## Development Workflow

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:server` | Start Express server with hot reload |
| `npm run dev:all` | Start both servers concurrently |
| `npm run build:all` | Build both frontend and server |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run db:reset` | Reset database and re-seed |

### Project Structure

```
storyboard/
├── src/               # Frontend source (React + TypeScript)
│   ├── features/      # Feature modules (self-contained)
│   ├── components/    # Shared components
│   ├── hooks/         # Custom React hooks
│   └── services/      # API client services
├── server/            # Backend source (Express + TypeScript)
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic services
│   ├── stores/        # Data access layer
│   └── utils/         # Utility functions
└── docs/              # Documentation
```

### Feature-First Architecture

We follow a feature-first architecture pattern. Each feature module in `src/features/` should be self-contained with:

- `components/` - Feature-specific React components
- `hooks/` - Feature-specific hooks
- `state/` - Zustand stores (if needed)
- `services/` - Feature-specific services (if needed)

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode - no `any` types without justification
- Use Zod for runtime validation at API boundaries

### React

- Prefer functional components with hooks
- Keep components under 300 lines
- Co-locate related code in feature modules

### Formatting

We use ESLint and Prettier for code formatting. Pre-commit hooks will automatically check your code.

To manually check:

```bash
npm run typecheck
```

## Commit Guidelines

### Pre-commit Hooks

This project uses Husky with lint-staged for pre-commit checks:

- TypeScript type checking on staged files
- Automatic formatting

If pre-commit checks fail, fix the issues before committing.

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add scene export to PDF
fix: resolve timeline drag and drop issue
docs: update API documentation
refactor: simplify scene state management
```

## Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes**:

   ```bash
   npm run typecheck
   npm run test
   ```

4. **Push and create a Pull Request**

5. **Wait for review** - maintainers will review your PR

### PR Checklist

- [ ] Code follows the project style guidelines
- [ ] TypeScript types are correctly defined
- [ ] Tests pass locally
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages are clear and descriptive

## Questions?

If you have questions, please open an issue or reach out to the maintainers.

---

Thank you for contributing! 🎨
