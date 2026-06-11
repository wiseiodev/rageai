# Development

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm plugin:build
pnpm checks
```

Run the web app:

```bash
pnpm --filter @rageai/web dev
```

Run the CLI locally:

```bash
pnpm --filter @rageai/cli build
node packages/rage-cli/dist/index.js scan
```

Run guardrails:

```bash
pnpm guardrails:plan
pnpm guardrails:doctor
```
