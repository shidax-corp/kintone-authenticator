# Instructions for AI Assistant

This file provides guidance to Claude Code and GitHub Copilot when working with code in this repository.

## Commands

Build the project:

```bash
npm run build
```

Type check, lint check, and format check:

```bash
npm run check
```

Format code:

```bash
npm run format
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
   - See also docs/lib-catalog.md for details on available libraries.

2. **Components** (`src/components/`) - Contains shared UI components between kintone and Chrome extension. See also docs/component-catalog.md for details on available components.

3. **Kintone App** (`src/kintone/`) - A customization for kintone that provides:
   - QR code reading functionality
   - OTP generation and management
   - Read [kintone requirements](docs/kintone-requirements.md) for more details.

4. **Chrome Extension** (`src/chrome/`) - Provides:
   - OTP generation capabilities
   - Auto-fill functionality for authentication
   - Read [Chrome extension requirements](docs/chrome-extension-requirements.md) for more details.

   ### Chrome Extension Directory Structure

   The `src/chrome/` directory follows this structure:
   - **`lib/`** - Shared functionality used across multiple Chrome extension components
     - `form-utils.ts` - Form-related utilities (URL normalization, input field detection, field type detection)
     - `kintone-url.ts` - Kintone URL parsing and validation
     - `record-matcher.ts` - Record matching logic (finding, sorting by priority)
     - `storage.ts` - Chrome storage API operations (settings and cache management)
     - `types.ts` - Type definitions for extension messages and settings
     - `RecordItem.tsx` - Record item React component (shared between popup and contents)
   - **`background/`** - Background service related files
     - `index.ts` - Entry point
     - Background-specific functionality (e.g., kintone-client.ts, qr-reader.ts)
   - **`contents/`** - Content scripts that run on web pages
     - `index.tsx` - Entry point
     - Content script-specific functionality (e.g., modal-renderer.ts, ModalBase.tsx)
   - **`popup/`** - Popup UI related files
     - `index.tsx` - Entry point
     - Popup-specific components
   - **`options/`** - Options page related files
     - `index.tsx` - Entry point
     - Options page-specific components
   - **`offscreen/`** - Offscreen document related files
     - `index.ts` - Entry point

   #### Chrome Extension Architecture Rules
   1. **Cross-Directory Reference Restrictions**
      - Direct references between directories (e.g., `contents/`, `background/`, `popup/`) are prohibited
      - Example: `contents/` → `background/` reference is NOT allowed
      - Allowed reference directories:
        - `src/lib/` - General-purpose libraries
        - `src/components/` - Shared UI components
        - `src/chrome/lib/` - Chrome extension shared functionality

   2. **Function Placement Principles**
      - Functions used in multiple directories → Place in `src/chrome/lib/`
      - Functions used only in a specific directory → Place within that directory
      - Examples:
        - `RecordItem.tsx` is used in both popup and contents → `src/chrome/lib/`
        - `kintone-client.ts` is used only in background → `src/chrome/background/`

   3. **File Naming Conventions**
      - Entry points must be named `index.ts` or `index.tsx`
      - Use descriptive names that clearly indicate functionality (e.g., `modal-renderer.ts`, `url-matcher.ts`)
      - Avoid misleading names (e.g., `qr-reader-service-worker.ts` → `qr-reader.ts`)

### Build System

- Uses esbuild for bundling (`build.mjs`)
- Seven entry points:
  - `src/kintone/desktop/index.tsx` → `dist/kintone/kintone-authenticator-desktop.js`
  - `src/kintone/mobile/index.tsx` → `dist/kintone/kintone-authenticator-mobile.js`
  - `src/chrome/popup/index.tsx` → `dist/chrome/index.js`
  - `src/chrome/background/index.ts` → `dist/chrome/background.js`
  - `src/chrome/contents/index.tsx` → `dist/chrome/content.js`
  - `src/chrome/options/index.tsx` → `dist/chrome/options/index.js`
  - `src/chrome/offscreen/index.ts` → `dist/chrome/offscreen.js`
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
- See also ./CONTRIBUTING.md for more details.

## Git guidelines

See also:

- Commit message guideline: .claude/skills/commit/SKILL.md
- GitHub Issues and Pull Requests guideline: .claude/skills/issue-and-pullrequest/SKILL.md
