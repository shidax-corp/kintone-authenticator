---
description: Check the issue and implement.
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [issue_number]
---

Following the steps below to fix the issue:

1. Check the issue #$ARGUMENTS.
2. Make a plan to address the issue.
3. Create a new branch for the issue.
4. Implement unit tests for the issue.
5. Implement the fix/enhance for the issue.
6. Execute formatting tools to ensure code style consistency.
7. Run the unit tests to ensure they pass.
8. Ask the user to review the changes.
9. Create a pull request with the changes.

Please include `Fixes #<issue_number>` in the pull request description to automatically close the issue when the pull request is merged.

think

# Issue #$ARGUMENTS

!gh issue view $ARGUMENTS
!gh issue view --comments $ARGUMENTS
