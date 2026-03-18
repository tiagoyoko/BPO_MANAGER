---
name: bmad-dev-story
description: Execute story implementation following a context filled story spec file. Use when the user says "dev this story [story file]" or "implement the next story in the sprint plan"
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL {project-root}/_bmad/bmm/workflows/4-implementation/dev-story/workflow.md, READ its entire contents and follow its directions exactly!

ADDITIONAL PROJECT RULE: before starting implementation, you MUST create or reuse a dedicated story branch and a dedicated git worktree for that branch. Do not develop directly in the user's currently-open working tree when git is available.

## TypeScript (bpo360-app / Next.js)

When implementing stories that touch **TypeScript**, **Next.js API routes**, or **front-end React** in this repo:

- **Consult the Mastering Modern TypeScript skill** (`/mastering-typescript` or the skill at `mastering-typescript/SKILL.md`): use it for type-safe patterns, Zod validation at API boundaries, `satisfies`, strict typing, and the project’s existing conventions.
- Align with **bpo360-app** setup: `src/types/api.ts` (`jsonSuccess`/`jsonError`/`parseBody`), `src/lib/api/schemas/` (Zod schemas), ESLint type-aware rules, Prettier, and `noUncheckedIndexedAccess` in tsconfig. Prefer the existing helpers and schemas instead of ad-hoc validation or response shapes.
