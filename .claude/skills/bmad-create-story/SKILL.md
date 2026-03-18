---
name: bmad-create-story
description: Creates a dedicated story file with all the context the agent will need to implement it later. Use when the user says "create the next story" or "create story [story identifier]"
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL {project-root}/_bmad/bmm/workflows/4-implementation/create-story/workflow.md, READ its entire contents and follow its directions exactly!

## TypeScript (bpo360-app / Next.js)

When the story will involve **TypeScript**, **Next.js API routes**, or **React** in this repo:

- **Consult the Mastering Modern TypeScript skill** (`/mastering-typescript` or the skill at `mastering-typescript/SKILL.md`): use it to ensure acceptance criteria and technical notes mention type-safe patterns, Zod validation at API boundaries, and existing project conventions.
- **Include in the story context** (so the dev agent has it): reference to `src/types/api.ts` (`jsonSuccess`/`jsonError`/`parseBody`), `src/lib/api/schemas/` for new or updated request bodies, and `docs/typescript-recommendations.md`. If the story adds or changes an API route, specify that body validation must use a Zod schema and the shared response helpers.
