# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this project is

**CareCard** is a proof-of-concept (POC) application intended to give caregivers
easy, at-a-glance overviews of their notes. Per the README:

> A POC for my wife's work; a simple application that can run on a variety of
> devices allowing for easy overviews of caregivers notes.

Key implications from that description:

- **Cross-device** is a core goal ("run on a variety of devices"). Favor
  approaches that work across phone/tablet/desktop rather than a single platform.
- **Simplicity** is explicit. This is a POC — prefer the smallest thing that
  demonstrates value over production-grade abstraction.
- The domain is **caregiver notes**: creating, viewing, and summarizing notes.
  Treat any note content as potentially sensitive personal/health information —
  do not log it, commit sample data with real details, or send it to external
  services without the user's say-so.

## Current state of the repository

⚠️ **This repository is greenfield.** As of this file's creation, there is
**no application source code yet**. The entire tracked contents are:

```
.gitignore    # GitHub's VisualStudio.gitignore template (.NET / Visual Studio)
LICENSE       # Apache License 2.0
README.md     # One-line project description
CLAUDE.md     # This file
```

There is no build system, no package manifest, no tests, and no CI configured.
**Do not describe a structure, framework, or workflow that does not exist.** When
this file and the actual repository disagree, the repository wins — and this file
should be updated to match.

## Tech stack (intended, not yet chosen)

Nothing is committed to yet. The only signal is the `.gitignore`, which is the
**Visual Studio / .NET** template (`bin/`, `obj/`, `*.suo`, NuGet, ReSharper,
MSTest/NUnit, SQL Server `.mdf`/`.ldf`, etc.). It also ignores `node_modules/`.

Combined with the "runs on a variety of devices" goal, a plausible direction is
a cross-platform .NET stack (e.g. **.NET MAUI**, **Blazor**, or an ASP.NET Core
web app), but **this has not been decided**. Before scaffolding anything, confirm
the framework choice with the user rather than assuming.

## Working conventions

- **Ask before scaffolding a stack.** The framework, language, and project layout
  are open decisions. Do not lock the project into MAUI/Blazor/etc. on your own —
  confirm direction first. Once decided, record it in this file.
- **Keep it a POC.** Avoid premature architecture (elaborate layering, DI
  frameworks, microservices). Small, working, demonstrable.
- **Handle note data carefully.** Assume caregiver notes contain sensitive
  personal information. Keep real data out of the repo; use obviously-fake
  placeholders in any sample/seed data.
- **Match existing style once code exists.** There is no code to match yet; when
  there is, mirror its formatting, naming, and idioms.

## Development workflow (git)

- **Default branch:** `main`.
- **Feature branches:** do work on a dedicated branch, not directly on `main`.
- **Push:** `git push -u origin <branch-name>`.
- **Pull requests:** only open a PR when the user explicitly asks. There is no
  PR template in the repo.
- There is currently **no build, test, or lint command** to run. Once a build
  system is added, document the exact commands here (build, run, test, lint) so
  assistants can verify their work.

## Maintaining this file

This file was generated when the repo was effectively empty. **Keep it accurate.**
When real code lands, update the sections above to describe:

- The chosen framework/language and how to build, run, and test the app.
- The actual directory layout and where key logic lives.
- Any conventions (naming, formatting, state management, data storage).
- CI/CD once configured.

Prefer updating stale sections over letting this file drift from reality.
