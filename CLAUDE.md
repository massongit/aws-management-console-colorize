# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension for Chrome and Firefox that colorizes the AWS Management Console. It allows users to assign colors to different AWS session ARNs to differentiate between multiple accounts and roles.

The extension consists of:
- A **content script** that modifies AWS console pages (header, footer, session selector)
- A **popup UI** (React-based) for managing color settings per session ARN
- Color settings stored in browser storage (synced across devices)

## Technology Stack

- **Build tool**: WXT (Web Extension Tools) - modern framework for building browser extensions
- **Runtime**: Bun (specified in `.bun-version`)
- **TypeScript**: Strict type checking with Zod for runtime validation
- **React**: Popup UI built with React 19 and react-color-palette
- **Testing**: Playwright for E2E tests

## Development Commands

### Initial Setup
```bash
bun install
```

### Development Mode
```bash
# Chrome extension with live reload
bun run dev:chrome

# Firefox extension with live reload
bun run dev:firefox
```

### Building
```bash
# Type check (runs before all builds)
bun run compile

# Production builds
bun run build:chrome
bun run build:firefox

# Development builds (for testing)
bun run build:chrome:dev
bun run build:firefox:dev
```

### Creating Distribution ZIP
```bash
# Production ZIPs (outputs to dist/)
bun run zip:chrome
bun run zip:firefox

# Development ZIPs
bun run zip:chrome:dev
bun run zip:firefox:dev
```

### Testing
```bash
# Run E2E tests (builds dev Chrome extension first)
bun run e2e
```

### Linting
```bash
# Format with Prettier
bunx prettier --write .
```

## Code Architecture

### Entry Points (`entrypoints/`)

- **`content.ts`**: Content script injected into AWS console pages
  - Handles both console pages and session selector pages
  - Listens for messages from popup via browser.runtime.onMessage
  - Uses MutationObserver to watch for dynamically loaded elements
  - Extracts session ARN from `<meta name="awsc-session-data">`

- **`popup/`**: Extension popup UI
  - `App.tsx`: Main React component managing color settings CRUD
  - Communicates with content script via browser.tabs.sendMessage
  - Uses react-color-palette for color picker

### Modules (`modules/`)

- **`color_settings.ts`**: Storage interface for color settings
  - Defines Zod schemas for type-safe color settings
  - Storage key: `"sync:colorSettings"` (synced across devices)

- **`lib.ts`**: Shared utilities
  - `MessageType` enum for popup ↔ content script communication
  - URL matching patterns for AWS console domains
  - `getMatches()`: Returns content script match patterns (includes file:// in dev mode)

### WXT Configuration

`wxt.config.ts` defines:
- Manifest settings (name, permissions)
- Browser-specific configuration
- Development keys for consistent extension IDs during testing

### Message Passing Architecture

The extension uses two message types between popup and content script:
1. `getSessionARN`: Popup requests current session ARN from content script
2. `changeColor`: Popup notifies content script to refresh colors after settings change

### Multi-page Support

Content script handles two AWS page types:
1. **Console pages** (`*.console.aws.amazon.com`): Colors header and footer navigation
2. **Session selector** (`*.signin.aws.amazon.com/sessions/selector`): Adds color blocks to session cards

### Browser Compatibility

- Chrome: Uses `key` field in manifest for consistent extension ID in development
- Firefox: Uses `browser_specific_settings.gecko.id` for development storage access

## Important Patterns

### Type Safety with Zod
Runtime validation with Zod ensures color settings from storage match expected schema. All storage reads are validated.

### Async Initialization
Content script uses MutationObserver pattern when target elements aren't immediately available (AWS console uses dynamic rendering).

### Storage Sync
Color settings use `sync:` storage prefix, automatically syncing across user's devices.

## Testing Notes

E2E tests (`tests/e2e/`) use Playwright with chromium profile. The dev build allows file:// protocol for loading local HTML fixtures.

## CI/CD

The project uses GitHub Actions with:
- `format.yml`: Auto-formatting with Prettier
- `playwright.yml`: E2E test execution
- `super-linter.yml`: Multi-language linting
- Security scanning with CodeQL and OSV-Scanner