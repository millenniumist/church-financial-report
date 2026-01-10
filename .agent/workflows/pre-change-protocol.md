---
description: Protocol to follow before making any code changes to ensure safety and reversibility.
---

// turbo-all

The agent must follow these steps before modifying any file in the codebase:

1.  **Assess Current State**
    - Run `git status` to check for uncommitted changes.
    - Run `git branch` to see the current working branch.

2.  **Ensure a Clean Slate**
    - If there are uncommitted changes:
        - Commit them before starting to ensure user work is preserved:
          ```bash
          git add .
          git commit -m "chore: pre-agent-task auto-save $(date +'%Y-%m-%d %H:%M:%S')"
          ```

3.  **Prepare for Task**
    - Create a new branch for the specific task:
      ```bash
      git checkout -b task/[task-description]-[timestamp]
      ```
    - This ensures all changes are isolated and can be merged or discarded easily.

4.  **Acknowledge Readiness**
    - Once the environment is clean and a new branch is active, the agent may proceed with the implementation plan.
