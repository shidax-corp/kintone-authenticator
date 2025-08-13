# Instructions for AI Assistant

This file provides guidance to Claude Code and GitHub Copilot when working with code in this repository.

## Commands

Build the project:
```bash
npm run build
```

Run development server:
```bash
npm run dev
```

Type check:
```bash
npm run check
```

Run tests:
```bash
npm run test
```

## Architecture

This is a kintone authenticator application similar to Google Authenticator, with two main components:

1. **Kintone App** (`src/kintone/`) - A customization for kintone that provides:
   - QR code reading functionality
   - OTP generation and management
   - PIN-based encryption for sensitive data

2. **Chrome Extension** (`src/chrome/`) - Provides:
   - OTP generation capabilities
   - Auto-fill functionality for authentication

### Build System

- Uses esbuild for bundling (`build.mjs`)
- Two entry points:
  - `src/kintone/index.tsx` → `dist/kintone/kintone-authenticator.js`
  - `src/chrome/index.tsx` → `dist/chrome/index.js`
- Assets are copied from `assets/` to `dist/`
- Path alias: `@lib/*` maps to `./src/lib/*`
- Development server available at http://localhost:8000 with `npm run dev`

## Development Guidelines

- Write comments in English. Clear and self-explanatory codes are preferred over excessive comments.
- Write unit tests as much as possible.
- Run `npm run check && npm run test` before committing.
- DO NOT use `as unknown` or `as any` in TypeScript. Use proper type definitions.

## Git guidelines

- For commit message, use the semantic commit messages in English. For example: `feat(kintone): add QR code scanning feature` or `fix(chrome): resolve auto-fill issue #123`.
- Separate commits for different features or fixes.
- For issues and PR, use a concise title and a detailed description.
