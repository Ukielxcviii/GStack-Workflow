# GStack Workflow

This is a monorepo workspace: every project lives under `projects/<project-name>/`,
each with its own `AGENTS.md`/`CLAUDE.md`, PRD, and code. This root file holds the
conventions shared across all of them. (`AGENTS.md` here is read by Codex CLI;
`CLAUDE.md` carries the identical content for Claude Code — keep them in sync.)

## gstack

This workspace uses [gstack](https://github.com/garrytan/gstack) skills, installed
globally at `~/.codex/skills/gstack-*/` for Codex CLI (and `~/.claude/skills/gstack`
for Claude Code). Use the `/browse` skill from gstack for all web browsing.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies,
/setup-deploy, /retro, /investigate, /document-release, /document-generate, /cso,
/autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze,
/gstack-upgrade, /learn, /spec

Note: the `/codex` skill is a Claude Code wrapper that calls out to Codex CLI for a
second opinion — it doesn't apply when you're already working from Codex itself.

## Layout

```
projects/
  <project-name>/
    CLAUDE.md / AGENTS.md   # project-specific context (stack, commands, conventions)
    docs/
      PRD.md                # the product requirements doc for this project
    src/                    # (or whatever the project's actual code layout is)
```

## Starting a new project

1. Copy `projects/_template/` to `projects/<project-name>/`.
2. Drop the PRD into `projects/<project-name>/docs/PRD.md`.
3. Fill in `projects/<project-name>/CLAUDE.md` / `AGENTS.md` (stack, build/test/dev
   commands).
4. Run `/office-hours` or `/spec` from inside that project folder to turn the PRD
   into a concrete build plan before writing code.
5. Use `/freeze` (or `/guard`) if you want edits scoped to just that project folder
   while other projects in the monorepo are mid-flight.

## Cross-project rules

- Never let one project's dependencies/build config leak into another's subfolder.
- Each project's CHANGELOG.md, VERSION, and CI concerns are project-local, not
  workspace-wide, unless a project explicitly says otherwise in its own context file.
