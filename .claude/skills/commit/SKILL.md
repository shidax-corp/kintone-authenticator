---
name: Commit Message
description: Create a proper git commit or branch.
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git commit:*), Bash(git checkout -b:*), Bash(gh issue list:*), Bash(gh issue view:*)
---

For commit message, use the conventional commit messages in Japanese. For example: `feat(kintone): QRコードを読み取る機能を実装` or `fix(chrome): 自動入力の問題を修正 #123`.

Use the following commit message types:

- `feat`: about new features or enhancements
- `fix`: fixes for bugs
- `docs`: documentation changes
- `style`: code style changes (e.g., formatting, missing semicolons, etc.)
- `refactor`: code refactoring without changing functionality
- `design`: design changes without changing functionality (e.g., UI/UX improvements)
- `perf`: performance improvements
- `test`: adding or modifying tests
- `chore`: other changes that do not fit into the above categories (e.g., build process, CI configuration, etc.)

Use the following prefix scopes:

- `xxx(kintone):` for kintone app related changes
- `xxx(chrome):` for Chrome extension related changes
- `xxx(lib):` for library related changes
- `xxx(components):` for shared components related changes
- `xxx(docs):` for documentation related changes
- `xxx:` for general changes not specific to any component

Rules:

- Separate commits for different features or fixes.
- Do not create commit to the main branch directly. Always create a new branch for your work.
- To create a branch, use `issue-<number>/<short-description>` format for branch names, where `<number>` is the issue number and `<short-description>` is a brief description of the feature or fix in lowercase with hyphens instead of spaces. You can check existing issues by `gh issue list`. If there is no issue related, use only `<short-description>`.
