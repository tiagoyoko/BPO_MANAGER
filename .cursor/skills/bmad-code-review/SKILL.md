---
name: bmad-code-review
description: Perform adversarial code review finding specific issues. Use when the user says "run code review" or "review this code"
---

IT IS CRITICAL THAT YOU FOLLOW THIS COMMAND: LOAD the FULL {project-root}/_bmad/bmm/workflows/4-implementation/code-review/workflow.md, READ its entire contents and follow its directions exactly!

## TypeScript (bpo360-app / Next.js)

When reviewing **TypeScript**, **Next.js API routes**, or **React** code in this repo:

- **Consult the Mastering Modern TypeScript skill** (`/mastering-typescript` or the skill at `mastering-typescript/SKILL.md`): use it to assess type safety, use of `any`/`unknown`, validation at boundaries (Zod), `satisfies` vs type assertions, strict mode and index access, and toolchain (ESLint, Prettier).
- Check alignment with **bpo360-app** conventions: API responses via `jsonSuccess`/`jsonError`, request body validation with `parseBody` and schemas from `src/lib/api/schemas/`, no raw `as unknown as` on Supabase data without a mapper, and consistency with `docs/typescript-recommendations.md` where applicable.
