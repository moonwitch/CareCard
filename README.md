# CareCard

CareCard helps you prepare for medical and care appointments. Record your
conditions, allergies, medications, sensory sensitivities, and support needs, and
CareCard uses AI to turn them into a clear, first-person, one-page document you
can print or hand to a professional — making it easier to say what you need.

Built with neurodivergent people, and anyone who finds it hard to vocalize in the
moment, in mind.

## Tech stack

- Bun (package manager + runtime), Node ≥ 22
- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Prisma over libSQL/SQLite — local file in dev, [Turso](https://turso.tech) in
  production (Supabase/Postgres also supported)
- Auth.js (email + password)
- Anthropic Claude API — bring your own key (BYOK)

## Getting started

```bash
bun install
cp .env.example .env      # fill in AUTH_SECRET (Turso vars only for production)
bunx prisma db push       # create the local SQLite database
bun run dev               # http://localhost:3000
```

CareCard is **bring-your-own-key**: paste your own Anthropic API key
(from [console.anthropic.com](https://console.anthropic.com)) into the app to
generate documents. Your key is stored only in your browser and is never saved on
the server.

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, and contributor
guidance.

## Privacy

CareCard handles sensitive personal health information. Data is stored per-user,
and your Anthropic API key stays in your browser — it's sent to the server only
transiently to call Claude and is never persisted. Never commit real data or
`.env` files.
