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
npm run check:type
```

Format check:

```bash
npm run check:format
```

Run all checks (type + lint + format):

```bash
npm run check
```

Format code:

```bash
npm run format
```

Lint check:

```bash
npm run check:lint
```

Fix lint issues:

```bash
npm run check:lint:fix
```

Run tests:

```bash
npm run test
```

## Architecture

This is a kintone authenticator application similar to Google Authenticator, with two main components:

1. **Library** (`src/lib/`) - Contains shared code for:
   - Base32エンコード/デコード機能 (`base32.ts`)
   - HMAC計算ユーティリティ (`hmac.ts`)
   - OTP生成機能 - HOTP/TOTP対応 (`gen-otp.ts`)
   - OTPAuth URI のエンコード/デコード (`otpauth-uri.ts`)
   - QRコード読み取り機能 (`qr-reader.ts`)
   - レコード検索・フィルタリング機能 (`search.ts`)
   - URL検証ユーティリティ (`url.ts`)
   - See also @docs/lib-catalog.md for details on available libraries.

2. **Components** (`src/components/`) - Contains shared UI components between kintone and Chrome extension. See also @docs/component-catalog.md for details on available components.

3. **Kintone App** (`src/kintone/`) - A customization for kintone that provides:
   - QR code reading functionality
   - OTP generation and management
   - Read [kintone requirements](docs/kintone-requirements.md) for more details.

4. **Chrome Extension** (`src/chrome/`) - Provides:
   - OTP generation capabilities
   - Auto-fill functionality for authentication
   - Read [Chrome extension requirements](docs/chrome-extension-requirements.md) for more details.

### Build System

- Uses esbuild for bundling (`build.mjs`)
- Five entry points:
  - `src/kintone/index.tsx` → `dist/kintone/kintone-authenticator.js`
  - `src/chrome/index.tsx` → `dist/chrome/index.js`
  - `src/chrome/background.ts` → `dist/chrome/background.js`
  - `src/chrome/content.ts` → `dist/chrome/content.js`
  - `src/chrome/options/index.tsx` → `dist/chrome/options/index.js`
- Assets are copied from `assets/` to `dist/`
- Path alias: `@lib/*` maps to `./src/lib/*`
- Path alias: `@components/*` maps to `./src/components/*`
- Development server available at http://localhost:8000 with `npm run dev`

## Development Guidelines

- Write comments and documents in Japanese. Clear and self-explanatory codes are preferred over excessive comments.
- Write unit tests when adding or modifying features.
- Check tests covers user's requirements, and it passes all tests.
- Use `@lib/*` and `@components/*` for importing libraries and components. Do not use relative path imports like `../../lib/` or `../../../components/` for importing files in these two directories
- Run `npm run format && npm run check && npm run test` before committing.
  - `npm run check` runs type checking, lint checking, and format checking.
  - All tests must pass before committing changes.
- DO NOT use `as unknown` or `as any` in TypeScript. Use proper type definitions.

## Git guidelines

- For commit message, use the semantic commit messages in Japanese. For example: `feat(kintone): QRコードを読み取る機能を実装` or `fix(chrome): 自動入力の問題を修正 #123`.
  - Use the following commit message types:
    - `feat`: about new features or enhancements
    - `fix`: fixes for bugs
    - `docs`: documentation changes
    - `style`: code style changes (e.g., formatting, missing semicolons, etc.)
    - `refactor`: code refactoring without changing functionality
    - `design`: design changes without changing functionality (e.g., UI/UX improvements)
    - `perf`: performance improvements
    - `test`: adding or modifying tests
    - `chore`: other changes that do not fit into the above categories (e.g., build process, CI configuration, etc.)
  - Use the following prefix scopes:
    - `xxx(kintone):` for kintone app related changes
    - `xxx(chrome):` for Chrome extension related changes
    - `xxx(lib):` for library related changes
    - `xxx(components):` for shared components related changes
    - `xxx(docs):` for documentation related changes
    - `xxx:` for general changes not specific to any component
- Separate commits for different features or fixes.
- For issues and PR, use a concise title and a detailed description.
- Use the label named `AI Created` for issues and PRs created by AI assistants. And set another proper labels if necessary.
- Write issues and PR descriptions in Japanese, but you can use English for technical terms.
- Write `(Written by Claude Code)` or `(Written by GitHub Copilot)` in the bottom of the Issue or PR description to indicate AI assistance.
