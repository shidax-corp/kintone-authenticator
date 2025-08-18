---
description: Update documentation about shared library and components.
---

Check the codes in @src/lib/ and @src/components/ and update the following documentation files:

- @docs/lib-catalog.md - Documentation about shared libraries in `src/lib/`. Do not include private functions or classes, only public APIs.
- @docs/components-catalog.md - Documentation about components in `src/components/`. Do not include private functions or classes, only public APIs.
- @CLAUDE.md - Overview of the project.

Note: For components directory, only document the top-level components, not the sub-components. For example, src/components/OTPInputField/Scanner.tsx is just a part of src/components/OTPInputField/index.tsx, so you don't need to document them separately.

think hard
