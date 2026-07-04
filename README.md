# CareCard

CareCard helps you prepare for medical and care appointments. Record your
conditions, allergies, medications, sensory sensitivities, and support needs, and
CareCard uses AI to turn them into a clear, first-person, one-page document you
can print or hand to a professional — making it easier to say what you need.

Built with neurodivergent people, and anyone who finds it hard to vocalize in the
moment, in mind.

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4
- Prisma (SQLite in dev, Postgres-ready)
- Auth.js (email + password)
- Anthropic Claude API (server-side)

## Getting started

```bash
npm install
cp .env.example .env      # fill in AUTH_SECRET and ANTHROPIC_API_KEY
npx prisma db push        # create the local SQLite database
npm run dev               # http://localhost:3000
```

Generating documents requires a Claude API key from
[console.anthropic.com](https://console.anthropic.com).

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, and contributor
guidance.

## Privacy

CareCard handles sensitive personal health information. Data is stored per-user
and only ever sent to Claude through your own server-side API key. Never commit
real data or `.env` files.
