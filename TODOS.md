# TODOs

## xcviii-digital-archive

### DAL enforcement tripwire
**What:** A grep-based tripwire test that fails CI if a new file under
`lib/*/actions.ts` is added without a `requireAdmin()`/`is_admin()` reference.
**Why:** The Data Access Layer auth pattern (every admin data-access function
must call `requireAdmin()`) is discipline-only right now — nothing catches
drift as the codebase grows past the pilot.
**Pros:** Cheap to write once, catches a real class of future auth bugs before
they ship.
**Cons:** Zero value today — one admin, one author, low file count. Adds a CI
step that needs maintaining as file patterns evolve.
**Context:** Surfaced by the outside-voice pass in `/plan-eng-review` on the
xcviii-digital-archive design (2026-07-28). Revisit once the codebase has more
than a handful of action files, or once a second contributor joins.
**Depends on / blocked by:** Phase 1-3 (auth + DAL pattern) must exist first —
nothing to grep for yet.

### Define pilot go/no-go metric before Phase 8 (scan_events schema)
**What:** Decide the concrete go/no-go threshold for the pilot (e.g. minimum
scan count per piece within N weeks, at least one unprompted recipient
reaction referencing the digital record, or the founder's own gut-check) —
see the design doc's "Success Criteria" open question — before locking the
`scan_events` schema in Phase 8.
**Why:** The schema (referrer, device_category, country_code,
anonymous_identifier — PRD §9.4) already covers most likely metrics, but if
the chosen threshold needs a dimension not in that list, building it now risks
rework exactly when the brand-wide rollout decision is on the line.
**Pros:** Avoids schema rework at the worst possible time; forces the pilot
success criteria to actually get defined instead of staying an open question
indefinitely.
**Cons:** Adds a decision point before Phase 8 can start; the existing schema
probably covers it anyway, so this may turn out to be unnecessary friction.
**Context:** Surfaced by the outside-voice pass in `/plan-eng-review` on the
xcviii-digital-archive design (2026-07-28). Design doc:
`~/.gstack/projects/Ukielxcviii-GStack-Workflow/ukielxcviii-main-design-20260728-152007.md`.
**Depends on / blocked by:** Should resolve before Phase 8 (scan tracking)
begins; does not block Phases 1-7.
