---
name: wattwise-collab
description: >-
  WattWise teammate sync and evidence-bound workflow. Use when working on
  WattWise UI, API integration, presentation assets, or checking collaborator
  pushes on codex/wattwise-implementation.
---

# WattWise collab

## Sync before acting

1. `git fetch origin`
2. Compare local tip to `origin/codex/wattwise-implementation` and list remote branches.
3. If the implementation branch advanced: review new commits and shared-file overlap (`frontend/src/api.ts`, `backend/src/risk.rs`, `backend/src/plan.rs`, `backend/src/main.rs`, `docs/api.md`). Integrate onto `codex/wattwise-ui-presentation` only. Stop and report unclear conflicts on API/behavior files — do not invent resolutions.
4. Re-read `docs/api.md` and any touched modules after sync. Do not assume prior session memory matches tip.

## Ownership

- Alan: frontend UX, preparation display, presenter assets, UI/API integration.
- Teammate: weather/outage data, index/model validation, Rust risk API.
- Coordinate before shared contract edits. Do not merge the UI branch into `codex/wattwise-implementation`. Never force-push the teammate’s branch.

## Evidence rules

- Authoritative contract: `frontend/src/api.ts` + `docs/api.md`.
- No probability claims, trained-model claims, or verified live AI claims without evidence in `docs/ai-validation.md` / `docs/verification.md`.
- Studio samples must be labeled presentation mode only.
- If a detail is not in the handoff, README, or `docs/*`, read the file or ask.

## Finish checks

Re-fetch before final verification. Report unrun checks accurately. Push only `codex/wattwise-ui-presentation` when the user asks.
