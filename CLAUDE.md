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

- **Bun** as the package manager and runtime (`bun install`, `bun run …`).
  Target **Node ≥ 22** for compatibility (`engines.node`).
- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict).
- **Tailwind CSS v4** (via `@tailwindcss/postcss`; no `tailwind.config` — theme
  lives in `src/app/globals.css`).
- **Prisma** ORM over **libSQL/SQLite**. Local dev uses a SQLite file
  (`prisma/dev.db`); production uses **Turso** (hosted libSQL) via the
  `@prisma/adapter-libsql` driver adapter. `src/lib/prisma.ts` switches to the
  Turso adapter automatically when `TURSO_DATABASE_URL` is set, otherwise it uses
  the local file. **Alternative free host:** to use **Supabase/Postgres** instead,
  set the `datasource` provider to `postgresql`, remove the libSQL adapter in
  `src/lib/prisma.ts`, and point `DATABASE_URL` at the Supabase connection string.
- **Auth.js (NextAuth v5, beta)** with a Credentials provider (email + password,
  hashed with `bcryptjs`) and **JWT sessions**.
- **Anthropic SDK** (`@anthropic-ai/sdk`) — **bring your own key (BYOK)**. Each
  user supplies their own Anthropic API key; it is stored **only in their browser**
  (localStorage), sent per-request in the `x-anthropic-key` header, used
  transiently server-side, and **never stored on the server or in the DB**. The
  server needs no Anthropic key. Default model `claude-sonnet-5` (override with
  `ANTHROPIC_MODEL`; use `claude-opus-4-8` for highest quality).
- **`next.config.ts`** lists the libSQL packages in `serverExternalPackages` so
  their native bindings aren't bundled by webpack — keep that if you touch it.
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
    prisma.ts            # PrismaClient singleton; local SQLite file or Turso (libSQL adapter)
    claude.ts            # server-only: per-request Claude client (BYOK), system prompt, prompt builder
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
      generate/route.ts            # authed + BYOK key header -> Claude -> save AppointmentDoc
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
bun install                 # installs deps; postinstall runs `prisma generate`
cp .env.example .env        # then fill in real values
bunx prisma db push         # create/sync the local SQLite dev database
bun run dev                 # http://localhost:3000
```

Other scripts:

- `bun run build` — `prisma generate && next build` (production build).
- `bun run start` — run the production build.
- `bun run lint` — ESLint (`eslint-config-next`).
- `bun run db:studio` — Prisma Studio to inspect data.
- After editing `prisma/schema.prisma`, run `bunx prisma db push` (dev). For Turso,
  apply the schema to the hosted DB with the Turso CLI or Prisma against
  `TURSO_DATABASE_URL`.

### Environment variables (`.env`, gitignored — see `.env.example`)

- `DATABASE_URL` — `file:./dev.db` for local SQLite dev.
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` — set in production to use Turso; when
  `TURSO_DATABASE_URL` is present the libSQL adapter is used instead of the file.
- `AUTH_SECRET` — required by Auth.js (`bunx auth secret` to generate).
- `ANTHROPIC_MODEL` — optional model override (default `claude-sonnet-5`).
- **No `ANTHROPIC_API_KEY`** — CareCard is BYOK; the key comes from the user's
  browser at request time, not from the server environment.

## Conventions

- **Server vs client:** default to Server Components. Client Components
  (`"use client"`) only where there's interactivity (auth forms, GenerateSection).
  Mutations go through **server actions** (`dashboard/actions.ts`) or route
  handlers; both re-check the session and scope every query to the current user.
- **Auth check pattern:** `const session = await auth()`; redirect to `/login`
  (pages) or return 401 (API) when absent. Never trust a `userId` from the client
  — always take it from `session.user.id`, and scope Prisma queries by it.
- **Validation:** use `zod` at every trust boundary (API routes, server actions).
- **BYOK handling:** the user's Anthropic key is passed in the `x-anthropic-key`
  header and used transiently. **Never persist it** (not in the DB, not in logs)
  and never echo request/error bodies that might contain it. `src/lib/prisma.ts`
  and the DB must still run only on the server — don't import them into a Client
  Component.
- **Styling:** Tailwind utility classes inline; shared theme/tokens in
  `globals.css`. Support light and dark (theme uses `prefers-color-scheme`).
- Match the existing formatting and naming when adding code.

## Development workflow (git)

- **Default branch:** `main`. Do work on a feature branch, not directly on `main`.
- **Push:** `git push -u origin <branch-name>`.
- **Pull requests:** only open one when the user explicitly asks. No PR template
  exists in the repo.
- Before committing non-trivial changes, run `bun run build` — it type-checks,
  lints, and confirms the app compiles.

## Verifying changes

There is no automated test suite yet. To verify manually:

1. `bun run build` for type/lint/compile safety.
2. `bun run dev`, then exercise the flow: register → sign in → fill profile → add
   items → paste your Anthropic API key → generate document. Generating requires a
   valid Anthropic key entered in the app (BYOK).

If you add tests, document how to run them here.

## Maintaining this file

Keep this file in sync with the code. When the stack, structure, data model, or
workflow changes, update the relevant section. When the repository and this file
disagree, the repository wins.
