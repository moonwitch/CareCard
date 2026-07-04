# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this project is

**CareCard** is a web app that helps a person prepare for medical or care
appointments. The user records their conditions, allergies, medications, sensory
sensitivities, and support needs; CareCard uses AI (Claude) to turn that into a
clear, first-person, one-page document they can print or hand to a professional
to help them vocalize what they need.

It is built with neurodivergent people — or anyone who finds it hard to speak up
in the moment — in mind. Two consequences to keep front of mind:

- **The data is sensitive personal/health information.** Never log note contents,
  never commit real data, and never send it anywhere except the user's own
  server-side Claude call. Use obviously-fake placeholders in any sample data.
- **The AI must not give medical advice or invent facts.** The generated document
  only restates what the user entered, in their own voice. The system prompt in
  `src/lib/claude.ts` enforces this — preserve those guardrails when editing it.

This is still a POC. Prefer the smallest thing that works over heavy architecture.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict).
- **Tailwind CSS v4** (via `@tailwindcss/postcss`; no `tailwind.config` — theme
  lives in `src/app/globals.css`).
- **Prisma** ORM. **SQLite** for local dev (`prisma/dev.db`); switch the
  `datasource` provider to `postgresql` and point `DATABASE_URL` at Postgres for
  production.
- **Auth.js (NextAuth v5, beta)** with a Credentials provider (email + password,
  hashed with `bcryptjs`) and **JWT sessions**.
- **Anthropic SDK** (`@anthropic-ai/sdk`) — Claude is called **only server-side**
  so the API key never reaches the browser. Default model `claude-sonnet-5`
  (override with `ANTHROPIC_MODEL`; use `claude-opus-4-8` for highest quality).
- Path alias: `@/*` → `src/*`.

## Project structure

```
prisma/
  schema.prisma          # User/auth models + domain models (Profile, CareItem, AppointmentDoc)
  dev.db                 # local SQLite db (gitignored)
src/
  auth.ts                # NextAuth config: Credentials provider, JWT callbacks
  types/next-auth.d.ts   # augments Session with user.id
  lib/
    prisma.ts            # PrismaClient singleton (hot-reload safe)
    claude.ts            # server-only Claude client, system prompt, prompt builder
    categories.ts        # CareCategory display metadata (labels/hints), shared UI + order
  app/
    layout.tsx           # root layout + globals
    globals.css          # Tailwind import, theme vars, .doc markdown styles
    page.tsx             # public landing page
    login/page.tsx       # client sign-in form (signIn from next-auth/react)
    register/page.tsx    # client sign-up form -> /api/register then auto sign-in
    dashboard/
      page.tsx           # authed dashboard (server component): profile + items + generate
      actions.ts         # server actions: saveProfile, addCareItem, deleteCareItem
      GenerateSection.tsx# client: calls /api/generate, renders/print/copy the document
    api/
      auth/[...nextauth]/route.ts  # NextAuth handlers
      register/route.ts            # create account (bcrypt hash, dup check)
      generate/route.ts            # authed: gather data -> Claude -> save AppointmentDoc
```

## Data model (see `prisma/schema.prisma`)

- **User / Account / Session / VerificationToken** — auth. Credentials + JWT means
  `Session`/`Account` rows aren't used yet, but are kept for future OAuth.
- **Profile** (1:1 with User) — displayName, pronouns, dateOfBirth,
  emergencyContact, `communicationNotes` (how the person communicates best).
- **CareItem** — one flexible table for all entries, discriminated by
  `CareCategory` enum: `CONDITION`, `ALLERGY`, `MEDICATION`, `SENSITIVITY`,
  `NEED`, `CONCERN`. A single table keeps both the UI and the Claude prompt simple.
- **AppointmentDoc** — saved generated documents (markdown `content` + which model).

When you add a new category, update the enum **and** `src/lib/categories.ts`
(labels/hints/order) **and** the section list in `src/lib/claude.ts`.

## Local setup & commands

```bash
npm install                 # installs deps; postinstall runs `prisma generate`
cp .env.example .env        # then fill in real values
npx prisma db push          # create/sync the SQLite dev database
npm run dev                 # http://localhost:3000
```

Other scripts:

- `npm run build` — `prisma generate && next build` (production build).
- `npm start` — run the production build.
- `npm run lint` — ESLint (`eslint-config-next`).
- `npm run db:studio` — Prisma Studio to inspect data.
- After editing `prisma/schema.prisma`, run `npx prisma db push` (dev) or create a
  migration for production.

### Environment variables (`.env`, gitignored — see `.env.example`)

- `DATABASE_URL` — `file:./dev.db` for SQLite dev; a Postgres URL in production.
- `AUTH_SECRET` — required by Auth.js (`npx auth secret` to generate).
- `ANTHROPIC_API_KEY` — server-side Claude key.
- `ANTHROPIC_MODEL` — optional model override (default `claude-sonnet-5`).

## Conventions

- **Server vs client:** default to Server Components. Client Components
  (`"use client"`) only where there's interactivity (auth forms, GenerateSection).
  Mutations go through **server actions** (`dashboard/actions.ts`) or route
  handlers; both re-check the session and scope every query to the current user.
- **Auth check pattern:** `const session = await auth()`; redirect to `/login`
  (pages) or return 401 (API) when absent. Never trust a `userId` from the client
  — always take it from `session.user.id`, and scope Prisma queries by it.
- **Validation:** use `zod` at every trust boundary (API routes, server actions).
- **Keep secrets server-side:** anything using `ANTHROPIC_API_KEY` or the DB must
  run on the server. Don't import `src/lib/claude.ts` or `src/lib/prisma.ts` into
  a Client Component.
- **Styling:** Tailwind utility classes inline; shared theme/tokens in
  `globals.css`. Support light and dark (theme uses `prefers-color-scheme`).
- Match the existing formatting and naming when adding code.

## Development workflow (git)

- **Default branch:** `main`. Do work on a feature branch, not directly on `main`.
- **Push:** `git push -u origin <branch-name>`.
- **Pull requests:** only open one when the user explicitly asks. No PR template
  exists in the repo.
- Before committing non-trivial changes, run `npm run build` — it type-checks,
  lints, and confirms the app compiles.

## Verifying changes

There is no automated test suite yet. To verify manually:

1. `npm run build` for type/lint/compile safety.
2. `npm run dev`, then exercise the flow: register → sign in → fill profile → add
   items → generate document. Generating requires a real `ANTHROPIC_API_KEY`.

If you add tests, document how to run them here.

## Maintaining this file

Keep this file in sync with the code. When the stack, structure, data model, or
workflow changes, update the relevant section. When the repository and this file
disagree, the repository wins.
