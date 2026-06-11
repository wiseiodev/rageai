<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.
<!-- context7 -->

# Rage AI Repo Notes

- Root scripts delegate to Turborepo. Put actual task commands in package `package.json` files.
- `apps/web` uses a `src/` directory and Node.js runtime route handlers for anything that imports `pg`.
- `packages/db` owns Drizzle schema and migrations.
- Host plugin folders under `plugins/` must be self-contained after `pnpm plugin:build`.
- Never publish raw transcript text, exact matched words, transcript paths, model names, raw IPs, or account identity.
