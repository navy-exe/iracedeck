# Contributing to iRaceDeck

Thank you for your interest in contributing to iRaceDeck! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) 10+
- [Elgato Stream Deck](https://docs.elgato.com/sdk/) software
- **Windows 10+** for full functionality (iRacing is Windows-only), but development of non-native features is supported on macOS with automatic mocks

For the native C++ addon (`@iracedeck/iracing-native`):
- Python 3.x and [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the C++ workload

### Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   pnpm build
   ```

## Development Workflow

### Building

```bash
pnpm build                    # Build all packages
pnpm build:stream-deck        # Build Stream Deck plugins only
pnpm watch:stream-deck        # Watch mode for Stream Deck plugins
```

### Testing

```bash
pnpm test                     # Run tests once
pnpm test:watch               # Run tests in watch mode
```

### Linting and Formatting

Always run these before committing:

```bash
pnpm lint:fix                 # Fix linting issues
pnpm format:fix               # Fix formatting issues
```

## Code Guidelines

### General

- Use Zod for settings validation (with `z.coerce` where appropriate)
- Prefer explicit types and interfaces when they improve readability
- No side effects in constructors or public methods — return new state, don't mutate
- All new code must include unit tests (Vitest with `describe`/`it`/`expect`)
- Test file naming: `foo.ts` → `foo.test.ts`

### Stream Deck Actions

- Actions live in `packages/stream-deck-plugin/src/actions/`
- All actions must extend `ConnectionStateAwareAction` from `src/shared/`
- **SDK-first**: always prefer iRacing SDK commands over keyboard shortcuts when both options exist
- Use keyboard shortcuts only when no SDK support is available
- Actions must not handle offline state themselves — this is handled centrally

### Icons

- Key icons: 72x72 SVG with `<g filter="url(#activity-state)">` wrapper
- Category icons: 20x20 monochrome white SVG
- See `.claude/rules/icons.md` for full guidelines

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Scope

The scope should usually be the package name:

- `iracing-native`
- `iracing-sdk`
- `logger`
- `stream-deck-plugin`
- `website`

### Examples

```
feat(stream-deck-plugin): add fuel calculation action
fix(iracing-sdk): handle disconnection gracefully
refactor(iracing-sdk): simplify telemetry parsing
```

## Pull Requests

1. Create a feature branch from `master` (`feature/123-your-feature`)
2. Make your changes following the guidelines above
3. Ensure all tests pass: `pnpm test`
4. Ensure the build succeeds: `pnpm build`
5. Run linting and formatting: `pnpm lint:fix && pnpm format:fix`
6. Commit with conventional commit messages
7. Open a pull request — PRs are squash-merged into `master`

## Project Structure

```
packages/
├── logger/                    # Shared logger interface
├── iracing-native/            # C++ N-API addon (shared memory, window messaging, scan codes)
├── iracing-sdk/               # TypeScript SDK (telemetry, broadcast commands, session parsing)
├── stream-deck-plugin/        # Stream Deck plugin (actions, icons, PI, shared utilities)
└── website/                   # Promotional website (iracedeck.com)
```

## Resources

- [iRacing SDK Documentation](https://forums.iracing.com/discussion/15068/official-iracing-sdk)
- [Stream Deck SDK Documentation](https://docs.elgato.com/sdk/)

## Questions?

If you have questions or need help, feel free to [open an issue](https://github.com/niklam/iracedeck/issues) for discussion.
