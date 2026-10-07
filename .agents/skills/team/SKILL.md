---
name: team
description: Orchestrate repository work through mandatory Linear issues, persistent Orca worktrees, and Opencode agents. Use when the user invokes /team or asks to delegate implementation to the agent team.
---

# /team

Codex is the orchestrator. Linear is mandatory. Opencode executes delegated work.

## Hard rules

- Never start repository work before resolving or creating a Linear issue.
- Never touch Prisma, databases, migrations, seeds, or Supabase unless the user explicitly authorizes it in the current request.
- Never use `git reset --hard`, `git clean`, force push, or discard uncommitted work.
- Work only inside the task worktree(s); never edit the primary checkout directly.
- Preserve existing `wt-front` and `wt-back` pools. Do not recreate or delete them per task.
- Do not close Linear until validation and the required evidence are complete.

## Models

- `opencode-go/muse-spark-1.3-contributor`: PM, programmers, Beautifulizer, Security Reviewer.
- `opencode-go/mimo-v2.5`: Architect, Orchestrator support, Optimizer, QA, final review.

Invoke Opencode with its installed CLI, using `opencode run --model <model> --prompt <prompt>` (or the locally supported equivalent). Never use `--auto` unless the user explicitly authorizes automatic permissions.

## Complete workflow

### 1. Bootstrap the repository once

Verify prerequisites:

```text
orca --version
opencode --version
python3 --version
```

Register the repository if absent:

```text
orca repo list
orca repo add --path "<absolute repo path>"
```

Create persistent pools only when missing:

```text
orca worktree create --name wt-front --repo <repo-name>
orca worktree create --name wt-back --repo <repo-name>
```

Verify each pool and its base branch. Never reset or clean a pool automatically.

### 2. Resolve Linear before reading or changing task code

Use `scripts/lin.py` from this skill, or an equivalent Linear integration:

```text
python scripts/lin.py teams
python scripts/lin.py projects <team-id>
```

Search the selected project by title/topic. If no issue exists, create it:

```text
python scripts/lin.py create <team-id> "<title>" "<description>" <project-id>
```

Move the issue to `In Progress` before implementation:

```text
python scripts/lin.py state <issue-id> "In Progress" <team-id>
```

If Linear credentials, team, project, or issue resolution fails, stop and report it.

### 3. Classify and allocate work

- XS: one programmer + light QA.
- S: programmer + QA; add Security only for auth/data.
- M: Architect, frontend/backend programmers in parallel, relevant reviewers, parallel QA.
- L: full team with decision gates.

Select pools:

```text
frontend only → wt-front
backend only → wt-back
frontend + backend → wt-front and wt-back
```

Before assignment, verify the selected pool is not occupied by another task and has no unrelated changes. If unsafe, stop; do not overwrite it.

### 4. Create the task branch

Use `fix/<LINEAR-IDENTIFIER>-<slug>` from the repository base. Determine the base in this order:

```text
dev if it exists → main if it exists → remote/default branch
```

All agents receive the issue ID, scope, assigned files, acceptance criteria, worktree path, and validation command. Frontend and backend tasks dispatch in one parallel batch.

### 5. Execute and gate

Codex dispatches Opencode agents and collects their outputs, diffs, and validation results. QA preparation may run during implementation; QA execution starts only after programmers finish.

Required gates:

```text
implementation complete → security review when relevant → QA pass → Codex final review
```

Failures return to the responsible agent with the exact error. Do not retry blindly. Do not merge with failing validation.

### 6. Close safely

On the integration checkout, detect the base branch using `dev → main → default`.

1. Inspect `git status`.
2. If pending changes belong to this task and block the merge, commit them first.
3. If pending changes are unrelated or ambiguous, stop; never commit them blindly.
4. Pull remote changes for the base branch when needed, preserving local commits and resolving conflicts without destructive commands.
5. Merge `fix/<LINEAR-IDENTIFIER>-<slug>` into the base branch.
6. Resolve and validate merge conflicts; stop if resolution is unsafe.
7. Run final QA on the merged base.
8. Push the updated base branch when the workflow has push access.
9. Add a Linear comment with changes, validation, and conditional evidence.
10. Move the issue to `Done`.

Keep persistent pools. Remove a task branch only after successful integration and only when it is not needed by another process.

## Evidence

- Backend-only: test/build logs; no screenshot required.
- Frontend: one 1440px screenshot plus DOM/accessibility snapshot.
- Responsive/layout: screenshots at 1440, 768, and 375px plus DOM/accessibility snapshot.

## Final response

Report: Linear issue, scope, agents/models used, worktrees, files changed, validations, merge target, push result, and any blocked step.
