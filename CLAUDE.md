# GStack Workflow

This is a monorepo workspace: every project lives under `projects/<project-name>/`,
each with its own `CLAUDE.md`, PRD, and code. This root `CLAUDE.md` holds the
conventions shared across all of them. (This repo also has an `AGENTS.md` with the
same content for when you work from Codex CLI instead — keep the two in sync.)

## gstack

This workspace uses [gstack](https://github.com/garrytan/gstack) skills for
AI-assisted development, installed globally at `~/.claude/skills/gstack`. Use the
`/browse` skill from gstack for all web browsing — never use `mcp__claude-in-chrome__*`
tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /plan-devex-review,
/devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn, /spec

## Layout

```
projects/
  <project-name>/
    CLAUDE.md       # project-specific context (stack, commands, conventions)
    docs/
      PRD.md         # the product requirements doc for this project
    src/             # (or whatever the project's actual code layout is)
```

## Starting a new project

1. Copy `projects/_template/` to `projects/<project-name>/`.
2. Drop the PRD into `projects/<project-name>/docs/PRD.md`.
3. Fill in `projects/<project-name>/CLAUDE.md` (stack, build/test/dev commands).
4. Run `/office-hours` or `/spec` from inside that project folder to turn the PRD
   into a concrete build plan before writing code.
5. Use `/freeze` (or `/guard`) if you want edits scoped to just that project folder
   while other projects in the monorepo are mid-flight.

## Cross-project rules

- Never let one project's dependencies/build config leak into another's subfolder.
- Each project's CHANGELOG.md, VERSION, and CI concerns are project-local, not
  workspace-wide, unless a project explicitly says otherwise in its own CLAUDE.md.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
